from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, TeamMember, TeamProject, CollaborationRequest, TeamChat
from services.mongodb_service import mongodb_service
from datetime import datetime, timezone, timedelta
from sqlalchemy import or_, and_
import json
import re
import uuid

team_bp = Blueprint('team', __name__)

# ==================== TEAM MEMBERS ====================

@team_bp.route('/members', methods=['GET'])
@jwt_required()
def get_team_members():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        owned_members = TeamMember.query.filter_by(owner_id=user.id).all()
        member_of = TeamMember.query.filter_by(member_id=user.id, status='active').all()
        result = []
        for member in owned_members:
            member_dict = member.to_dict()
            if member.member_id:
                member_user = User.query.get(member.member_id)
                if member_user:
                    member_dict['member_name'] = member_user.display_name or member_user.email
            result.append(member_dict)
        for membership in member_of:
            owner = User.query.get(membership.owner_id)
            if owner:
                result.append({
                    'id': membership.id,
                    'owner_id': membership.owner_id,
                    'member_email': owner.email,
                    'member_id': owner.id,
                    'member_name': owner.display_name or owner.email,
                    'role': 'owner',
                    'status': 'active',
                    'created_at': membership.created_at.isoformat() if membership.created_at else None,
                    'is_owner': True
                })
        return jsonify({'success': True, 'members': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/members/invite', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def invite_member():
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        if not email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        existing = TeamMember.query.filter_by(owner_id=user.id, member_email=email).first()
        if existing:
            return jsonify({'success': False, 'error': 'Member already invited'}), 400
        invited_user = User.query.filter_by(email=email).first()
        member = TeamMember(
            owner_id=user.id,
            member_email=email,
            member_id=invited_user.id if invited_user else None,
            role='member',
            status='pending'
        )
        db.session.add(member)
        if invited_user:
            request_obj = CollaborationRequest(
                from_user_id=user.id,
                to_email=email,
                to_user_id=invited_user.id,
                message=f'{user.email} invited you to join their team',
                request_type='join_team',
                status='pending'
            )
            db.session.add(request_obj)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Invitation sent successfully', 'member': member.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/members/<member_id>', methods=['DELETE'])
@jwt_required()
def remove_member(member_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        member = TeamMember.query.filter_by(id=member_id, owner_id=user.id).first()
        if not member:
            return jsonify({'success': False, 'error': 'Member not found'}), 404
        db.session.delete(member)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Member removed'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== PROJECTS ====================

@team_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        owned_projects = TeamProject.query.filter_by(owner_id=user.id).all()
        all_projects = TeamProject.query.all()
        member_projects = []
        for project in all_projects:
            if project.owner_id == user.id:
                continue
            try:
                members_list = json.loads(project.members) if project.members else []
                if user.email in members_list:
                    member_projects.append(project)
            except:
                pass
        all_user_projects = owned_projects + member_projects
        
        # Add leader email to each project
        projects_with_leader = []
        for project in all_user_projects:
            project_dict = project.to_dict()
            # Get owner/leader info
            owner = User.query.get(project.owner_id)
            if owner:
                project_dict['leader_email'] = owner.email
                project_dict['leader_name'] = owner.display_name or owner.email
            else:
                project_dict['leader_email'] = 'Unknown'
                project_dict['leader_name'] = 'Unknown'
            projects_with_leader.append(project_dict)
        
        return jsonify({'success': True, 'projects': projects_with_leader}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def create_project():
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Project name is required'}), 400
        project = TeamProject(
            owner_id=user.id,
            name=name,
            description=data.get('description', ''),
            status='active',
            members=json.dumps([user.email])
        )
        db.session.add(project)
        db.session.commit()
        
        # Add leader info to response
        project_dict = project.to_dict()
        project_dict['leader_email'] = user.email
        project_dict['leader_name'] = user.display_name or user.email
        
        return jsonify({'success': True, 'message': 'Project created successfully', 'project': project_dict}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required(optional=True)
def delete_project(project_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        project = TeamProject.query.filter_by(id=project_id, owner_id=user.id).first()
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        db.session.delete(project)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Project deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>/members', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def add_project_member(project_id):
    """Add a member to a project and send invitation notification"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify project ownership
        project = TeamProject.query.filter_by(id=project_id, owner_id=user.id).first()
        if not project:
            return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
        data = request.get_json()
        # Accept both 'email' and 'member_email' for compatibility
        member_email = data.get('member_email') or data.get('email', '')
        member_email = member_email.strip().lower()
        
        if not member_email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        # Parse existing members
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        # Check if already a member
        if member_email in members_list:
            return jsonify({'success': False, 'error': 'Member already in project'}), 400
        
        # Check if user exists
        invited_user = User.query.filter_by(email=member_email).first()
        if not invited_user:
            return jsonify({'success': False, 'error': 'User not found. They must have an account first.'}), 404
        
        # Add member to project
        members_list.append(member_email)
        project.members = json.dumps(members_list)
        
        # Create invitation notification
        notification = CollaborationRequest(
            from_user_id=user.id,
            to_email=member_email,
            to_user_id=invited_user.id,
            project_id=project_id,
            message=f'{user.display_name or user.email} invited you to join project "{project.name}"',
            request_type='project_invitation',
            status='pending'
        )
        db.session.add(notification)
        
        # Create MongoDB notification
        mongodb_service.create_notification(
            user_id=invited_user.firebase_uid,
            notification_type='project_invitation',
            title='Project Invitation',
            message=f'{user.display_name or user.email} invited you to join project "{project.name}"',
            link=f'/team?tab=requests',
            metadata={
                'inviter_id': user.id,
                'inviter_email': user.email,
                'inviter_name': user.display_name or user.email,
                'project_id': project_id,
                'project_name': project.name,
                'action': 'project_invitation'
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'{member_email} invited to project successfully',
            'members': members_list
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>/members/<member_email>', methods=['DELETE', 'OPTIONS'])
@jwt_required(optional=True)
def remove_project_member(project_id, member_email):
    # Handle OPTIONS preflight - return immediately without JWT check
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    # For DELETE requests, require JWT
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        project = TeamProject.query.filter_by(id=project_id, owner_id=user.id).first()
        if not project:
            return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        if member_email not in members_list:
            return jsonify({'success': False, 'error': 'Member not in project'}), 404
        members_list.remove(member_email)
        project.members = json.dumps(members_list)
        db.session.commit()
        return jsonify({'success': True, 'message': f'{member_email} removed from project'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>/tasks', methods=['PUT', 'OPTIONS'])
@jwt_required(optional=True)
def update_project_tasks(project_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        is_owner = project.owner_id == user.id
        is_member = False
        try:
            members_list = json.loads(project.members) if project.members else []
            is_member = user.email in members_list
        except:
            pass
        if not is_owner and not is_member:
            return jsonify({'success': False, 'error': 'Not authorized'}), 403
        data = request.get_json()
        tasks = data.get('tasks', [])
        
        # Get old tasks to compare
        try:
            existing = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            desc_text = existing.get('description', project.description or '')
            old_tasks = existing.get('tasks', [])
        except:
            desc_text = project.description or ''
            old_tasks = []
        
        # Check for newly assigned tasks and completed tasks
        old_tasks_dict = {task.get('id'): task for task in old_tasks if task.get('id')}
        
        for task in tasks:
            task_id = task.get('id')
            if not task_id:
                continue
                
            old_task = old_tasks_dict.get(task_id)
            
            # Check if task was newly assigned
            if old_task:
                old_assignee = old_task.get('assignee')
                new_assignee = task.get('assignee')
                
                # Task newly assigned or reassigned
                if new_assignee and new_assignee != old_assignee:
                    assignee_user = User.query.filter_by(email=new_assignee).first()
                    if assignee_user and is_owner:  # Only owner can assign tasks
                        notification = CollaborationRequest(
                            from_user_id=user.id,
                            to_email=new_assignee,
                            to_user_id=assignee_user.id,
                            project_id=project_id,
                            message=f'{user.email} assigned you task "{task.get("title", "Untitled")}" in project "{project.name}"',
                            request_type='task_assignment',
                            status='pending'
                        )
                        db.session.add(notification)
                
                # Task marked as completed
                old_status = old_task.get('status', 'todo')
                new_status = task.get('status', 'todo')
                if old_status != 'done' and new_status == 'done' and not is_owner:
                    # Member completed a task, notify owner
                    owner = User.query.get(project.owner_id)
                    if owner:
                        notification = CollaborationRequest(
                            from_user_id=user.id,
                            to_email=owner.email,
                            to_user_id=owner.id,
                            project_id=project_id,
                            message=f'{user.email} completed task "{task.get("title", "Untitled")}" in project "{project.name}"',
                            request_type='task_completed',
                            status='pending'
                        )
                        db.session.add(notification)
            else:
                # New task created with assignee
                new_assignee = task.get('assignee')
                if new_assignee and is_owner:
                    assignee_user = User.query.filter_by(email=new_assignee).first()
                    if assignee_user:
                        notification = CollaborationRequest(
                            from_user_id=user.id,
                            to_email=new_assignee,
                            to_user_id=assignee_user.id,
                            project_id=project_id,
                            message=f'{user.email} assigned you task "{task.get("title", "Untitled")}" in project "{project.name}"',
                            request_type='task_assignment',
                            status='pending'
                        )
                        db.session.add(notification)
        
        project.description = json.dumps({'description': desc_text, 'tasks': tasks})
        db.session.commit()
        return jsonify({'success': True, 'message': 'Tasks updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== COLLABORATION REQUESTS ====================

@team_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_requests():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        requests = CollaborationRequest.query.filter_by(to_email=user.email, status='pending').all()
        result = []
        for req in requests:
            req_dict = req.to_dict()
            sender = User.query.get(req.from_user_id)
            if sender:
                req_dict['from_email'] = sender.email
                req_dict['from_name'] = sender.display_name or sender.email
            result.append(req_dict)
        return jsonify({'success': True, 'requests': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/requests/sent', methods=['GET'])
@jwt_required()
def get_sent_requests():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        requests = CollaborationRequest.query.filter_by(from_user_id=user.id).all()
        return jsonify({'success': True, 'requests': [r.to_dict() for r in requests]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/requests/<request_id>/accept', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def accept_request(request_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        req = CollaborationRequest.query.filter_by(id=request_id, to_email=user.email, status='pending').first()
        if not req:
            return jsonify({'success': False, 'error': 'Request not found'}), 404
        req.status = 'accepted'
        req.responded_at = datetime.now(timezone.utc)
        req.to_user_id = user.id
        if req.request_type == 'join_team':
            member = TeamMember.query.filter_by(owner_id=req.from_user_id, member_email=user.email).first()
            if member:
                member.status = 'active'
                member.member_id = user.id
        elif req.request_type == 'project_invitation':
            # Use project_id from the request object
            if req.project_id:
                project = TeamProject.query.get(req.project_id)
                if project:
                    try:
                        members_list = json.loads(project.members) if project.members else []
                    except:
                        members_list = []
                    if user.email not in members_list:
                        members_list.append(user.email)
                        project.members = json.dumps(members_list)
                    leader = User.query.get(project.owner_id)
                    if leader:
                        leader_notification = CollaborationRequest(
                            from_user_id=user.id,
                            to_email=leader.email,
                            to_user_id=leader.id,
                            project_id=project.id,
                            message=f'{user.email} accepted your invitation and joined project "{project.name}"',
                            request_type='member_joined',
                            status='pending'
                        )
                        db.session.add(leader_notification)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Request accepted successfully', 'request_type': req.request_type}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/requests/<request_id>/reject', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def reject_request(request_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        req = CollaborationRequest.query.filter_by(id=request_id, to_email=user.email, status='pending').first()
        if not req:
            return jsonify({'success': False, 'error': 'Request not found'}), 404
        req.status = 'rejected'
        req.responded_at = datetime.now(timezone.utc)
        req.to_user_id = user.id
        member = TeamMember.query.filter_by(owner_id=req.from_user_id, member_email=user.email).first()
        if member:
            db.session.delete(member)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Request rejected'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== STATS ====================

@team_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_team_stats():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        members_count = TeamMember.query.filter_by(owner_id=user.id).count()
        projects_count = TeamProject.query.filter_by(owner_id=user.id).count()
        pending_requests = CollaborationRequest.query.filter_by(to_email=user.email, status='pending').count()
        projects = TeamProject.query.filter_by(owner_id=user.id).all()
        shared_content = sum(p.content_count for p in projects)
        return jsonify({
            'success': True,
            'stats': {
                'team_members': members_count + 1,
                'active_projects': projects_count,
                'shared_content': shared_content,
                'pending_requests': pending_requests
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== NOTIFICATIONS ====================

@team_bp.route('/notifications/task', methods=['POST'])
@jwt_required()
def send_task_notification():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        assignee_email = data.get('assignee_email', '').strip().lower()
        task_title = data.get('task_title', '')
        project_name = data.get('project_name', '')
        project_id = data.get('project_id', '')
        notification_type = data.get('type', 'task_assigned')
        if not assignee_email:
            return jsonify({'success': False, 'error': 'Assignee email required'}), 400
        assignee_user = User.query.filter_by(email=assignee_email).first()
        if not assignee_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if notification_type == 'task_assigned':
            message = f'New task assigned to you: "{task_title}" in project "{project_name}" (project_id:{project_id})'
            req_type = 'task_assignment'
        else:
            message = f'Task completed: "{task_title}" was completed by {user.email} in project "{project_name}"'
            req_type = 'task_completed'
        notification = CollaborationRequest(
            from_user_id=user.id,
            to_email=assignee_email,
            to_user_id=assignee_user.id,
            message=message,
            request_type=req_type,
            status='pending'
        )
        db.session.add(notification)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Notification sent'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        notifications = CollaborationRequest.query.filter_by(
            to_email=user.email, status='pending'
        ).order_by(CollaborationRequest.created_at.desc()).all()
        result = []
        for notif in notifications:
            notif_dict = notif.to_dict()
            sender = User.query.get(notif.from_user_id)
            if sender:
                notif_dict['from_email'] = sender.email
                notif_dict['from_name'] = sender.display_name or sender.email
            result.append(notif_dict)
        return jsonify({'success': True, 'notifications': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/notifications/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        notif = CollaborationRequest.query.filter_by(id=notification_id, to_email=user.email).first()
        if notif:
            notif.status = 'read'
            db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/notifications/<notification_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required(optional=True)
def delete_notification(notification_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        notif = CollaborationRequest.query.filter_by(id=notification_id, to_email=user.email).first()
        if not notif:
            return jsonify({'error': 'Notification not found'}), 404
        
        db.session.delete(notif)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Notification deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/notifications/clear', methods=['DELETE', 'OPTIONS'])
@jwt_required(optional=True)
def clear_all_notifications():
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete all notifications for this user
        CollaborationRequest.query.filter_by(to_email=user.email).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': 'All notifications cleared'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>/tasks/<task_id>/review', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def review_task(project_id, task_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Only project owner can review tasks
        if project.owner_id != user.id:
            return jsonify({'success': False, 'error': 'Only project owner can review tasks'}), 403
        
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'revert'
        
        if action not in ['approve', 'revert']:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400
        
        # Get current tasks
        try:
            existing = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            desc_text = existing.get('description', project.description or '')
            tasks = existing.get('tasks', [])
        except:
            desc_text = project.description or ''
            tasks = []
        
        # Find the task
        task_found = False
        for task in tasks:
            if task.get('id') == task_id:
                task_found = True
                assignee_email = task.get('assignee')
                task_title = task.get('title', 'Untitled')
                
                if action == 'approve':
                    # Task approved - keep it as done
                    # Optionally send approval notification
                    if assignee_email:
                        assignee_user = User.query.filter_by(email=assignee_email).first()
                        if assignee_user:
                            notification = CollaborationRequest(
                                from_user_id=user.id,
                                to_email=assignee_email,
                                to_user_id=assignee_user.id,
                                project_id=project_id,
                                message=f'{user.email} approved your task "{task_title}" in project "{project.name}"',
                                request_type='task_approved',
                                status='pending'
                            )
                            db.session.add(notification)
                
                elif action == 'revert':
                    # Revert task back to in-progress
                    task['status'] = 'in-progress'
                    
                    # Send revert notification to assignee
                    if assignee_email:
                        assignee_user = User.query.filter_by(email=assignee_email).first()
                        if assignee_user:
                            notification = CollaborationRequest(
                                from_user_id=user.id,
                                to_email=assignee_email,
                                to_user_id=assignee_user.id,
                                project_id=project_id,
                                message=f'{user.email} reverted task "{task_title}" in project "{project.name}". Please review and complete again.',
                                request_type='task_reverted',
                                status='pending'
                            )
                            db.session.add(notification)
                
                break
        
        if not task_found:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Save updated tasks
        project.description = json.dumps({'description': desc_text, 'tasks': tasks})
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'Task {action}d successfully',
            'tasks': tasks
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== TEAM CHAT ====================

@team_bp.route('/chat/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        owned_members = TeamMember.query.filter_by(owner_id=user.id, status='active').all()
        member_of = TeamMember.query.filter_by(member_id=user.id, status='active').all()
        conversations = []
        for member in owned_members:
            if member.member_id:
                other_user = User.query.get(member.member_id)
                if other_user:
                    last_message = TeamChat.query.filter(
                        or_(
                            and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user.id),
                            and_(TeamChat.sender_id == other_user.id, TeamChat.receiver_id == user.id)
                        )
                    ).order_by(TeamChat.created_at.desc()).first()
                    unread_count = TeamChat.query.filter_by(sender_id=other_user.id, receiver_id=user.id, is_read=False).count()
                    conversations.append({
                        'user_id': other_user.id,
                        'user_email': other_user.email,
                        'user_name': other_user.display_name or other_user.email,
                        'last_message': last_message.message if last_message else None,
                        'last_message_time': last_message.created_at.isoformat() if last_message else None,
                        'unread_count': unread_count
                    })
        for membership in member_of:
            owner = User.query.get(membership.owner_id)
            if owner:
                last_message = TeamChat.query.filter(
                    or_(
                        and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == owner.id),
                        and_(TeamChat.sender_id == owner.id, TeamChat.receiver_id == user.id)
                    )
                ).order_by(TeamChat.created_at.desc()).first()
                unread_count = TeamChat.query.filter_by(sender_id=owner.id, receiver_id=user.id, is_read=False).count()
                conversations.append({
                    'user_id': owner.id,
                    'user_email': owner.email,
                    'user_name': owner.display_name or owner.email,
                    'last_message': last_message.message if last_message else None,
                    'last_message_time': last_message.created_at.isoformat() if last_message else None,
                    'unread_count': unread_count
                })
        return jsonify({'success': True, 'conversations': conversations}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/chat/<other_user_id>', methods=['GET'])
@jwt_required()
def get_chat_messages(other_user_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        is_team_member = TeamMember.query.filter(
            or_(
                and_(TeamMember.owner_id == user.id, TeamMember.member_id == other_user_id),
                and_(TeamMember.owner_id == other_user_id, TeamMember.member_id == user.id)
            ),
            TeamMember.status == 'active'
        ).first()
        if not is_team_member:
            return jsonify({'success': False, 'error': 'Not team members'}), 403
        messages = TeamChat.query.filter(
            or_(
                and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user_id),
                and_(TeamChat.sender_id == other_user_id, TeamChat.receiver_id == user.id)
            )
        ).order_by(TeamChat.created_at.asc()).all()
        TeamChat.query.filter_by(sender_id=other_user_id, receiver_id=user.id, is_read=False).update({'is_read': True})
        db.session.commit()
        other_user = User.query.get(other_user_id)
        return jsonify({
            'success': True,
            'messages': [m.to_dict() for m in messages],
            'other_user': {
                'id': other_user.id,
                'email': other_user.email,
                'name': other_user.display_name or other_user.email
            } if other_user else None
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/chat/<other_user_id>', methods=['POST'])
@jwt_required()
def send_chat_message(other_user_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        is_team_member = TeamMember.query.filter(
            or_(
                and_(TeamMember.owner_id == user.id, TeamMember.member_id == other_user_id),
                and_(TeamMember.owner_id == other_user_id, TeamMember.member_id == user.id)
            ),
            TeamMember.status == 'active'
        ).first()
        if not is_team_member:
            return jsonify({'success': False, 'error': 'Not team members'}), 403
        data = request.get_json()
        message_text = data.get('message', '').strip()
        if not message_text:
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        message = TeamChat(sender_id=user.id, receiver_id=other_user_id, message=message_text, is_read=False)
        db.session.add(message)
        db.session.commit()
        return jsonify({'success': True, 'message': message.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/chat/<other_user_id>/clear', methods=['DELETE'])
@jwt_required()
def clear_chat(other_user_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        TeamChat.query.filter(
            or_(
                and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user_id),
                and_(TeamChat.sender_id == other_user_id, TeamChat.receiver_id == user.id)
            )
        ).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Chat cleared successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/chat/<other_user_id>/export', methods=['GET'])
@jwt_required()
def export_chat(other_user_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        messages = TeamChat.query.filter(
            or_(
                and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user_id),
                and_(TeamChat.sender_id == other_user_id, TeamChat.receiver_id == user.id)
            )
        ).order_by(TeamChat.created_at.asc()).all()
        other_user = User.query.get(other_user_id)
        export_data = {
            'conversation_with': other_user.email if other_user else 'Unknown',
            'exported_at': datetime.now(timezone.utc).isoformat(),
            'message_count': len(messages),
            'messages': [m.to_dict() for m in messages]
        }
        return jsonify({'success': True, 'data': export_data}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== ROLE MANAGEMENT ====================

@team_bp.route('/projects/<project_id>/members/<member_email>/role', methods=['PUT', 'OPTIONS'])
@jwt_required(optional=True)
def update_member_role(project_id, member_email):
    """Update a member's role in the project (leader can promote/demote)"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify project ownership
        project = TeamProject.query.filter_by(id=project_id, owner_id=user.id).first()
        if not project:
            return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
        data = request.get_json()
        new_role = data.get('role', 'member')  # 'leader', 'member'
        
        # Parse project description to get member roles
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            member_roles = project_data.get('member_roles', {})
            desc_text = project_data.get('description', '')
            tasks = project_data.get('tasks', [])
        except:
            member_roles = {}
            desc_text = project.description or ''
            tasks = []
        
        # Update role
        member_roles[member_email] = new_role
        project_data = {
            'description': desc_text,
            'tasks': tasks,
            'member_roles': member_roles
        }
        project.description = json.dumps(project_data)
        
        # Notify member about role change
        member_user = User.query.filter_by(email=member_email).first()
        if member_user:
            notification = CollaborationRequest(
                from_user_id=user.id,
                to_email=member_email,
                to_user_id=member_user.id,
                project_id=project_id,
                message=f'{user.display_name or user.email} changed your role to {new_role} in project "{project.name}"',
                request_type='role_change',
                status='pending'
            )
            db.session.add(notification)
            
            mongodb_service.create_notification(
                user_id=member_user.firebase_uid,
                notification_type='role_change',
                title='Role Updated',
                message=f'Your role in "{project.name}" has been changed to {new_role}',
                link=f'/team?tab=projects&project={project_id}',
                metadata={
                    'changer_id': user.id,
                    'changer_email': user.email,
                    'project_id': project_id,
                    'project_name': project.name,
                    'new_role': new_role,
                    'action': 'role_change'
                }
            )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Role updated to {new_role}',
            'member_roles': member_roles
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@team_bp.route('/projects/<project_id>/transfer-leadership', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def transfer_leadership(project_id):
    """Transfer project leadership to another member (requires acceptance)"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify project ownership
        project = TeamProject.query.filter_by(id=project_id, owner_id=user.id).first()
        if not project:
            return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
        data = request.get_json()
        new_leader_email = data.get('new_leader_email', '').strip().lower()
        
        if not new_leader_email:
            return jsonify({'success': False, 'error': 'New leader email is required'}), 400
        
        # Verify new leader is a project member
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        if new_leader_email not in members_list:
            return jsonify({'success': False, 'error': 'User must be a project member first'}), 400
        
        # Find new leader user
        new_leader = User.query.filter_by(email=new_leader_email).first()
        if not new_leader:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Create leadership transfer request
        notification = CollaborationRequest(
            from_user_id=user.id,
            to_email=new_leader_email,
            to_user_id=new_leader.id,
            project_id=project_id,
            message=f'{user.display_name or user.email} wants to transfer leadership of project "{project.name}" to you',
            request_type='leadership_transfer',
            status='pending'
        )
        db.session.add(notification)
        
        mongodb_service.create_notification(
            user_id=new_leader.firebase_uid,
            notification_type='leadership_transfer',
            title='Leadership Transfer Request',
            message=f'{user.display_name or user.email} wants to make you the leader of "{project.name}"',
            link=f'/team?tab=requests',
            metadata={
                'from_user_id': user.id,
                'from_email': user.email,
                'project_id': project_id,
                'project_name': project.name,
                'action': 'leadership_transfer'
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Leadership transfer request sent to {new_leader_email}'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@team_bp.route('/requests/<request_id>/accept-leadership', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def accept_leadership_transfer(request_id):
    """Accept leadership transfer request"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Find request
        req = CollaborationRequest.query.filter_by(
            id=request_id,
            to_email=user.email,
            request_type='leadership_transfer',
            status='pending'
        ).first()
        
        if not req:
            return jsonify({'success': False, 'error': 'Request not found'}), 404
        
        # Get project
        project = TeamProject.query.get(req.project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Get old owner
        old_owner = User.query.get(project.owner_id)
        
        # Transfer ownership
        project.owner_id = user.id
        
        # Update request status
        req.status = 'accepted'
        req.responded_at = datetime.now(timezone.utc)
        
        # Notify old owner
        if old_owner:
            notification = CollaborationRequest(
                from_user_id=user.id,
                to_email=old_owner.email,
                to_user_id=old_owner.id,
                project_id=project.id,
                message=f'{user.display_name or user.email} accepted leadership of project "{project.name}"',
                request_type='leadership_accepted',
                status='pending'
            )
            db.session.add(notification)
            
            mongodb_service.create_notification(
                user_id=old_owner.firebase_uid,
                notification_type='leadership_accepted',
                title='Leadership Transferred',
                message=f'{user.display_name or user.email} is now the leader of "{project.name}"',
                link=f'/team?tab=projects',
                metadata={
                    'new_leader_id': user.id,
                    'new_leader_email': user.email,
                    'project_id': project.id,
                    'project_name': project.name,
                    'action': 'leadership_accepted'
                }
            )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'You are now the project leader!'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== TASK SUBMISSIONS ====================

@team_bp.route('/projects/<project_id>/tasks/<task_id>/submit', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def submit_task(project_id, task_id):
    """Submit a task with work details/links"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        data = request.get_json()
        submission_text = data.get('submission_text', '').strip()
        submission_link = data.get('submission_link', '').strip()
        
        if not submission_text and not submission_link:
            return jsonify({'success': False, 'error': 'Please provide submission details or link'}), 400
        
        # Get tasks from project
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            tasks = project_data.get('tasks', [])
            desc_text = project_data.get('description', '')
            member_roles = project_data.get('member_roles', {})
        except:
            tasks = []
            desc_text = project.description or ''
            member_roles = {}
        
        # Find and update task
        task_found = False
        for task in tasks:
            if task.get('id') == task_id:
                task['submission'] = {
                    'text': submission_text,
                    'link': submission_link,
                    'submitted_at': datetime.now(timezone.utc).isoformat(),
                    'submitted_by': user.email
                }
                task['status'] = 'done'
                task['completedBy'] = user.email
                task['completedAt'] = datetime.now(timezone.utc).isoformat()
                task_found = True
                task_title = task.get('title', 'Task')
                break
        
        if not task_found:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Save updated tasks
        project.description = json.dumps({
            'description': desc_text,
            'tasks': tasks,
            'member_roles': member_roles
        })
        
        # Notify project owner
        owner = User.query.get(project.owner_id)
        if owner and owner.id != user.id:
            notification = CollaborationRequest(
                from_user_id=user.id,
                to_email=owner.email,
                to_user_id=owner.id,
                project_id=project_id,
                message=f'{user.display_name or user.email} submitted task "{task_title}" in project "{project.name}"',
                request_type='task_submitted',
                status='pending'
            )
            db.session.add(notification)
            
            mongodb_service.create_notification(
                user_id=owner.firebase_uid,
                notification_type='task_submitted',
                title='Task Submitted',
                message=f'{user.display_name or user.email} submitted "{task_title}"',
                link=f'/team?tab=projects&project={project_id}',
                metadata={
                    'submitter_id': user.id,
                    'submitter_email': user.email,
                    'project_id': project_id,
                    'project_name': project.name,
                    'task_id': task_id,
                    'task_title': task_title,
                    'submission_text': submission_text[:100],
                    'submission_link': submission_link,
                    'action': 'task_submitted'
                }
            )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task submitted successfully! Leader will review it.',
            'tasks': tasks
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== DAILY UPDATES & NOTIFICATIONS ====================

@team_bp.route('/projects/<project_id>/daily-update', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def post_daily_update(project_id):
    """Post a daily update for the project (visible to all members)"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Verify user is a member
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        if user.email not in members_list and project.owner_id != user.id:
            return jsonify({'success': False, 'error': 'Not a project member'}), 403
        
        data = request.get_json()
        update_text = data.get('update_text', '').strip()
        
        if not update_text:
            return jsonify({'success': False, 'error': 'Update text is required'}), 400
        
        # Get project data
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            daily_updates = project_data.get('daily_updates', [])
            desc_text = project_data.get('description', '')
            tasks = project_data.get('tasks', [])
            member_roles = project_data.get('member_roles', {})
        except:
            daily_updates = []
            desc_text = project.description or ''
            tasks = []
            member_roles = {}
        
        # Add new update
        new_update = {
            'id': str(uuid.uuid4()),
            'user_email': user.email,
            'user_name': user.display_name or user.email,
            'text': update_text,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        daily_updates.insert(0, new_update)  # Add to beginning
        
        # Keep only last 50 updates
        daily_updates = daily_updates[:50]
        
        # Save updated data
        project.description = json.dumps({
            'description': desc_text,
            'tasks': tasks,
            'member_roles': member_roles,
            'daily_updates': daily_updates
        })
        
        # Notify all project members
        for member_email in members_list:
            if member_email != user.email:
                member_user = User.query.filter_by(email=member_email).first()
                if member_user:
                    mongodb_service.create_notification(
                        user_id=member_user.firebase_uid,
                        notification_type='daily_update',
                        title='Project Update',
                        message=f'{user.display_name or user.email} posted an update in "{project.name}"',
                        link=f'/team?tab=projects&project={project_id}',
                        metadata={
                            'poster_id': user.id,
                            'poster_email': user.email,
                            'project_id': project_id,
                            'project_name': project.name,
                            'update_text': update_text[:100],
                            'action': 'daily_update'
                        }
                    )
        
        # Also notify owner if not the poster
        if project.owner_id != user.id:
            owner = User.query.get(project.owner_id)
            if owner:
                mongodb_service.create_notification(
                    user_id=owner.firebase_uid,
                    notification_type='daily_update',
                    title='Project Update',
                    message=f'{user.display_name or user.email} posted an update in "{project.name}"',
                    link=f'/team?tab=projects&project={project_id}',
                    metadata={
                        'poster_id': user.id,
                        'poster_email': user.email,
                        'project_id': project_id,
                        'project_name': project.name,
                        'update_text': update_text[:100],
                        'action': 'daily_update'
                    }
                )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Update posted successfully',
            'daily_updates': daily_updates
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@team_bp.route('/projects/<project_id>/daily-updates', methods=['GET'])
@jwt_required()
def get_daily_updates(project_id):
    """Get all daily updates for a project"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Verify user is a member
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        if user.email not in members_list and project.owner_id != user.id:
            return jsonify({'success': False, 'error': 'Not a project member'}), 403
        
        # Get daily updates
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            daily_updates = project_data.get('daily_updates', [])
        except:
            daily_updates = []
        
        return jsonify({
            'success': True,
            'daily_updates': daily_updates
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== PROJECT INVITATION LINKS ====================

@team_bp.route('/projects/<project_id>/invitation-link', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def generate_invitation_link(project_id):
    """Generate a shareable invitation link for project"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Verify user is a member or owner
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        if user.email not in members_list and project.owner_id != user.id:
            return jsonify({'success': False, 'error': 'Not authorized'}), 403
        
        # Generate unique invitation token
        invitation_token = str(uuid.uuid4())
        
        # Store invitation in project description
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            desc_text = project_data.get('description', '')
            tasks = project_data.get('tasks', [])
            member_roles = project_data.get('member_roles', {})
            daily_updates = project_data.get('daily_updates', [])
            invitations = project_data.get('invitations', {})
        except:
            desc_text = project.description or ''
            tasks = []
            member_roles = {}
            daily_updates = []
            invitations = {}
        
        # Add new invitation
        invitations[invitation_token] = {
            'created_by': user.email,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'expires_at': (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            'uses': 0,
            'max_uses': 10
        }
        
        # Save
        project.description = json.dumps({
            'description': desc_text,
            'tasks': tasks,
            'member_roles': member_roles,
            'daily_updates': daily_updates,
            'invitations': invitations
        })
        
        db.session.commit()
        
        # Generate invitation URL
        invitation_url = f"{request.host_url}team/join/{project_id}/{invitation_token}"
        
        return jsonify({
            'success': True,
            'invitation_url': invitation_url,
            'invitation_token': invitation_token,
            'expires_at': invitations[invitation_token]['expires_at']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@team_bp.route('/projects/join/<project_id>/<invitation_token>', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def join_project_via_link(project_id, invitation_token):
    """Join project using invitation link"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Parse project data
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            invitations = project_data.get('invitations', {})
            members_list = json.loads(project.members) if project.members else []
        except:
            return jsonify({'success': False, 'error': 'Invalid project data'}), 400
        
        # Verify invitation
        if invitation_token not in invitations:
            return jsonify({'success': False, 'error': 'Invalid invitation link'}), 404
        
        invitation = invitations[invitation_token]
        
        # Check expiration
        expires_at = datetime.fromisoformat(invitation['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            return jsonify({'success': False, 'error': 'Invitation link has expired'}), 400
        
        # Check max uses
        if invitation['uses'] >= invitation['max_uses']:
            return jsonify({'success': False, 'error': 'Invitation link has reached maximum uses'}), 400
        
        # Check if already a member
        if user.email in members_list:
            return jsonify({'success': False, 'error': 'You are already a member of this project'}), 400
        
        # Add user to project
        members_list.append(user.email)
        project.members = json.dumps(members_list)
        
        # Update invitation uses
        invitation['uses'] += 1
        invitations[invitation_token] = invitation
        
        # Save
        project_data['invitations'] = invitations
        project.description = json.dumps(project_data)
        
        # Notify project owner
        owner = User.query.get(project.owner_id)
        if owner:
            notification = CollaborationRequest(
                from_user_id=user.id,
                to_email=owner.email,
                to_user_id=owner.id,
                project_id=project_id,
                message=f'{user.display_name or user.email} joined project "{project.name}" via invitation link',
                request_type='member_joined',
                status='pending'
            )
            db.session.add(notification)
            
            mongodb_service.create_notification(
                user_id=owner.firebase_uid,
                notification_type='member_joined',
                title='New Member Joined',
                message=f'{user.display_name or user.email} joined "{project.name}"',
                link=f'/team?tab=projects&project={project_id}',
                metadata={
                    'joiner_id': user.id,
                    'joiner_email': user.email,
                    'project_id': project_id,
                    'project_name': project.name,
                    'action': 'member_joined'
                }
            )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully joined project "{project.name}"!',
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== PROJECT REPORTS ====================

@team_bp.route('/projects/<project_id>/report', methods=['GET'])
@jwt_required()
def get_project_report(project_id):
    """Get comprehensive project report (for leaders)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Verify user is owner or has leader role
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            member_roles = project_data.get('member_roles', {})
            tasks = project_data.get('tasks', [])
            daily_updates = project_data.get('daily_updates', [])
        except:
            member_roles = {}
            tasks = []
            daily_updates = []
        
        is_owner = project.owner_id == user.id
        is_leader = member_roles.get(user.email) == 'leader'
        
        if not is_owner and not is_leader:
            return jsonify({'success': False, 'error': 'Only project leaders can view reports'}), 403
        
        # Generate report
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.get('status') == 'done'])
        in_progress_tasks = len([t for t in tasks if t.get('status') == 'doing'])
        todo_tasks = len([t for t in tasks if t.get('status') == 'todo'])
        
        # Task submissions
        submitted_tasks = [t for t in tasks if t.get('submission')]
        
        # Member statistics
        members_list = json.loads(project.members) if project.members else []
        member_stats = {}
        
        for member_email in members_list:
            member_tasks = [t for t in tasks if t.get('assignee') == member_email]
            member_stats[member_email] = {
                'total_tasks': len(member_tasks),
                'completed': len([t for t in member_tasks if t.get('status') == 'done']),
                'in_progress': len([t for t in member_tasks if t.get('status') == 'doing']),
                'todo': len([t for t in member_tasks if t.get('status') == 'todo']),
                'role': member_roles.get(member_email, 'member')
            }
        
        # Recent activity
        recent_updates = daily_updates[:10] if daily_updates else []
        
        report = {
            'project_id': project_id,
            'project_name': project.name,
            'owner_id': project.owner_id,
            'created_at': project.created_at.isoformat() if project.created_at else None,
            'summary': {
                'total_members': len(members_list),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'todo_tasks': todo_tasks,
                'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
            },
            'tasks': tasks,
            'submitted_tasks': submitted_tasks,
            'member_stats': member_stats,
            'recent_updates': recent_updates,
            'members': members_list
        }
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== PROJECT GROUP CHAT ====================

@team_bp.route('/projects/<project_id>/chat/messages', methods=['GET'])
@jwt_required()
def get_project_chat_messages(project_id):
    """Get all messages in project group chat"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Verify user is a member
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        if user.email not in members_list and project.owner_id != user.id:
            return jsonify({'success': False, 'error': 'Not a project member'}), 403
        
        # Get messages from project description
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            chat_messages = project_data.get('chat_messages', [])
        except:
            chat_messages = []
        
        return jsonify({
            'success': True,
            'messages': chat_messages,
            'project_name': project.name
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@team_bp.route('/projects/<project_id>/chat/messages', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def send_project_chat_message(project_id):
    """Send a message to project group chat"""
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authorization required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get project
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Verify user is a member
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        
        if user.email not in members_list and project.owner_id != user.id:
            return jsonify({'success': False, 'error': 'Not a project member'}), 403
        
        data = request.get_json()
        message_text = data.get('message', '').strip()
        
        if not message_text:
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        # Get project data
        try:
            project_data = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            chat_messages = project_data.get('chat_messages', [])
            desc_text = project_data.get('description', '')
            tasks = project_data.get('tasks', [])
            member_roles = project_data.get('member_roles', {})
            daily_updates = project_data.get('daily_updates', [])
            invitations = project_data.get('invitations', {})
        except:
            chat_messages = []
            desc_text = project.description or ''
            tasks = []
            member_roles = {}
            daily_updates = []
            invitations = {}
        
        # Add new message
        new_message = {
            'id': str(uuid.uuid4()),
            'user_id': user.id,
            'user_email': user.email,
            'user_name': user.display_name or user.email,
            'message': message_text,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        chat_messages.append(new_message)
        
        # Keep only last 500 messages
        chat_messages = chat_messages[-500:]
        
        # Save
        project.description = json.dumps({
            'description': desc_text,
            'tasks': tasks,
            'member_roles': member_roles,
            'daily_updates': daily_updates,
            'invitations': invitations,
            'chat_messages': chat_messages
        })
        
        # Notify all project members except sender
        for member_email in members_list:
            if member_email != user.email:
                member_user = User.query.filter_by(email=member_email).first()
                if member_user:
                    mongodb_service.create_notification(
                        user_id=member_user.firebase_uid,
                        notification_type='project_chat',
                        title=f'New message in {project.name}',
                        message=f'{user.display_name or user.email}: {message_text[:50]}...',
                        link=f'/team?tab=projects&project={project_id}&chat=true',
                        metadata={
                            'sender_id': user.id,
                            'sender_email': user.email,
                            'project_id': project_id,
                            'project_name': project.name,
                            'message_preview': message_text[:100],
                            'action': 'project_chat'
                        }
                    )
        
        # Also notify owner if not sender
        if project.owner_id != user.id:
            owner = User.query.get(project.owner_id)
            if owner:
                mongodb_service.create_notification(
                    user_id=owner.firebase_uid,
                    notification_type='project_chat',
                    title=f'New message in {project.name}',
                    message=f'{user.display_name or user.email}: {message_text[:50]}...',
                    link=f'/team?tab=projects&project={project_id}&chat=true',
                    metadata={
                        'sender_id': user.id,
                        'sender_email': user.email,
                        'project_id': project_id,
                        'project_name': project.name,
                        'message_preview': message_text[:100],
                        'action': 'project_chat'
                    }
                )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': new_message
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== PUBLIC USER DIRECTORY ====================

@team_bp.route('/users/directory', methods=['GET'])
@jwt_required()
def get_user_directory():
    """Get all registered users with basic public information"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get all users
        all_users = User.query.all()
        
        # Get profile service to fetch additional details
        from services.profile_service import profile_service
        
        users_list = []
        for user in all_users:
            # Skip current user
            if user.id == current_user_id:
                continue
            
            # Get profile from MongoDB
            profile = profile_service.get_profile(user.id)
            
            user_data = {
                'id': user.id,
                'email': user.email,
                'display_name': user.display_name or user.email.split('@')[0],
                'created_at': user.created_at.isoformat() if user.created_at else None,
                # Public profile fields
                'professional_title': profile.get('professional_title', '') if profile else '',
                'location': profile.get('location', '') if profile else '',
                'bio': profile.get('bio', '')[:200] if profile and profile.get('bio') else '',  # Truncate bio
                'category': profile.get('category', 'professional') if profile else 'professional',
                'niche_tags': profile.get('niche_tags', [])[:5] if profile else [],  # Limit to 5 tags
                'skills': profile.get('skills', [])[:5] if profile else [],  # Limit to 5 skills
                'open_to_collaboration': profile.get('open_to_collaboration', True) if profile else True,
                'profile_color': profile.get('profile_color', '#6366f1') if profile else '#6366f1'
            }
            users_list.append(user_data)
        
        return jsonify({
            'success': True,
            'users': users_list,
            'total': len(users_list)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== TEAM ACTIVITY FEED ====================

@team_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_team_activity():
    """Get team activity feed with recent actions"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get limit from query params (default 50)
        limit = request.args.get('limit', 50, type=int)
        
        activities = []
        
        # 1. Recent projects created
        recent_projects = TeamProject.query.filter_by(owner_id=current_user.id).order_by(TeamProject.created_at.desc()).limit(10).all()
        for project in recent_projects:
            activities.append({
                'id': f'project_{project.id}',
                'type': 'project_created',
                'icon': '📁',
                'title': 'Project Created',
                'description': f'Created project "{project.name}"',
                'user': current_user.display_name or current_user.email,
                'timestamp': project.created_at.isoformat() if project.created_at else None,
                'metadata': {
                    'project_id': project.id,
                    'project_name': project.name
                }
            })
        
        # 2. Recent team members added
        recent_members = TeamMember.query.filter_by(owner_id=current_user.id).order_by(TeamMember.created_at.desc()).limit(10).all()
        for member in recent_members:
            activities.append({
                'id': f'member_{member.id}',
                'type': 'member_added',
                'icon': '👥',
                'title': 'Team Member Added',
                'description': f'Added {member.member_email} to the team',
                'user': current_user.display_name or current_user.email,
                'timestamp': member.created_at.isoformat() if member.created_at else None,
                'metadata': {
                    'member_email': member.member_email,
                    'role': member.role
                }
            })
        
        # 3. Recent collaboration requests
        recent_requests = CollaborationRequest.query.filter(
            or_(
                CollaborationRequest.from_user_id == current_user.id,
                CollaborationRequest.to_user_id == current_user.id
            )
        ).order_by(CollaborationRequest.created_at.desc()).limit(10).all()
        
        for req in recent_requests:
            if req.status == 'accepted':
                icon = '✅'
                title = 'Request Accepted'
            elif req.status == 'rejected':
                icon = '❌'
                title = 'Request Rejected'
            else:
                icon = '📬'
                title = 'Request Sent'
            
            activities.append({
                'id': f'request_{req.id}',
                'type': f'request_{req.status}',
                'icon': icon,
                'title': title,
                'description': req.message or 'Collaboration request',
                'user': current_user.display_name or current_user.email,
                'timestamp': req.created_at.isoformat() if req.created_at else None,
                'metadata': {
                    'request_type': req.request_type,
                    'status': req.status
                }
            })
        
        # 4. Recent chat messages
        recent_chats = TeamChat.query.filter(
            or_(
                TeamChat.from_user_id == current_user.id,
                TeamChat.to_user_id == current_user.id
            )
        ).order_by(TeamChat.created_at.desc()).limit(10).all()
        
        for chat in recent_chats:
            other_user = User.query.get(chat.to_user_id if chat.from_user_id == current_user.id else chat.from_user_id)
            if other_user:
                activities.append({
                    'id': f'chat_{chat.id}',
                    'type': 'chat_message',
                    'icon': '💬',
                    'title': 'Chat Message',
                    'description': f'Message with {other_user.display_name or other_user.email}',
                    'user': current_user.display_name or current_user.email,
                    'timestamp': chat.created_at.isoformat() if chat.created_at else None,
                    'metadata': {
                        'other_user': other_user.email,
                        'message_preview': chat.message[:50] if chat.message else ''
                    }
                })
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        # Limit results
        activities = activities[:limit]
        
        return jsonify({
            'success': True,
            'activities': activities,
            'total': len(activities)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
