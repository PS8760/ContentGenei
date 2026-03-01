# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from models import db, User, TeamMember, TeamProject, CollaborationRequest, TeamChat
# from datetime import datetime, timezone
# from sqlalchemy import or_, and_
# import json
# import re

# team_bp = Blueprint('team', __name__)

# # ==================== TEAM MEMBERS ====================

# @team_bp.route('/members', methods=['GET'])
# @jwt_required()
# def get_team_members():
#     """Get all team members for the current user (both as owner and as member)"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Get members where current user is the owner
#         owned_members = TeamMember.query.filter_by(owner_id=user.id).all()
        
#         # Get teams where current user is a member (accepted invitations)
#         member_of = TeamMember.query.filter_by(
#             member_id=user.id,
#             status='active'
#         ).all()
        
#         # Combine and format results
#         result = []
        
#         # Add owned members
#         for member in owned_members:
#             member_dict = member.to_dict()
#             # Get member user info if exists
#             if member.member_id:
#                 member_user = User.query.get(member.member_id)
#                 if member_user:
#                     member_dict['member_name'] = member_user.display_name or member_user.email
#             result.append(member_dict)
        
#         # Add teams where user is a member (show the owner as a "team member")
#         for membership in member_of:
#             owner = User.query.get(membership.owner_id)
#             if owner:
#                 result.append({
#                     'id': membership.id,
#                     'owner_id': membership.owner_id,
#                     'member_email': owner.email,
#                     'member_id': owner.id,
#                     'member_name': owner.display_name or owner.email,
#                     'role': 'owner',
#                     'status': 'active',
#                     'created_at': membership.created_at.isoformat() if membership.created_at else None,
#                     'is_owner': True  # Flag to indicate this is the team owner
#                 })
        
#         return jsonify({
#             'success': True,
#             'members': result
#         }), 200
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/members/invite', methods=['POST'])
# @jwt_required()
# def invite_member():
#     """Invite a new team member"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         data = request.get_json()
#         email = data.get('email', '').strip().lower()
        
#         if not email:
#             return jsonify({'success': False, 'error': 'Email is required'}), 400
        
#         # Check if already invited
#         existing = TeamMember.query.filter_by(
#             owner_id=user.id,
#             member_email=email
#         ).first()
        
#         if existing:
#             return jsonify({'success': False, 'error': 'Member already invited'}), 400
        
#         # Check if user exists
#         invited_user = User.query.filter_by(email=email).first()
        
#         # Create team member
#         member = TeamMember(
#             owner_id=user.id,
#             member_email=email,
#             member_id=invited_user.id if invited_user else None,
#             role='member',
#             status='pending'
#         )
#         db.session.add(member)
        
#         # Create collaboration request if user exists
#         if invited_user:
#             request_obj = CollaborationRequest(
#                 from_user_id=user.id,
#                 to_email=email,
#                 to_user_id=invited_user.id,
#                 message=f'{user.email} invited you to join their team',
#                 request_type='join_team',
#                 status='pending'
#             )
#             db.session.add(request_obj)
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Invitation sent successfully',
#             'member': member.to_dict()
#         }), 201
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/members/<member_id>', methods=['DELETE'])
# @jwt_required()
# def remove_member(member_id):
#     """Remove a team member"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         member = TeamMember.query.filter_by(
#             id=member_id,
#             owner_id=user.id
#         ).first()
        
#         if not member:
#             return jsonify({'success': False, 'error': 'Member not found'}), 404
        
#         db.session.delete(member)
#         db.session.commit()
        
#         return jsonify({'success': True, 'message': 'Member removed'}), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# # ==================== PROJECTS ====================

# @team_bp.route('/projects', methods=['GET'])
# @jwt_required()
# def get_projects():
#     """Get all projects for the current user (owned + member of)"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Get projects owned by user
#         owned_projects = TeamProject.query.filter_by(owner_id=user.id).all()
        
#         # Get projects where user is a member
#         all_projects = TeamProject.query.all()
#         member_projects = []
        
#         for project in all_projects:
#             if project.owner_id == user.id:
#                 continue  # Skip owned projects (already in owned_projects)
            
#             try:
#                 members_list = json.loads(project.members) if project.members else []
#                 if user.email in members_list:
#                     member_projects.append(project)
#             except:
#                 pass
        
#         # Combine and return
#         all_user_projects = owned_projects + member_projects
        
#         return jsonify({
#             'success': True,
#             'projects': [p.to_dict() for p in all_user_projects]
#         }), 200
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/projects', methods=['POST'])
# @jwt_required()
# def create_project():
#     """Create a new project"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         data = request.get_json()
#         name = data.get('name', '').strip()
        
#         if not name:
#             return jsonify({'success': False, 'error': 'Project name is required'}), 400
        
#         project = TeamProject(
#             owner_id=user.id,
#             name=name,
#             description=data.get('description', ''),
#             status='active',
#             members=json.dumps([user.email])
#         )
        
#         db.session.add(project)
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Project created successfully',
#             'project': project.to_dict()
#         }), 201
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/projects/<project_id>', methods=['DELETE'])
# @jwt_required()
# def delete_project(project_id):
#     """Delete a project"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         project = TeamProject.query.filter_by(
#             id=project_id,
#             owner_id=user.id
#         ).first()
        
#         if not project:
#             return jsonify({'success': False, 'error': 'Project not found'}), 404
        
#         db.session.delete(project)
#         db.session.commit()
        
#         return jsonify({'success': True, 'message': 'Project deleted'}), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500
# @team_bp.route('/projects/<project_id>/members', methods=['POST'])
# @jwt_required()
# def add_project_member(project_id):
#     """Add a member to a project and send notification"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         project = TeamProject.query.filter_by(
#             id=project_id,
#             owner_id=user.id
#         ).first()
        
#         if not project:
#             return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
#         data = request.get_json()
#         member_email = data.get('email', '').strip().lower()
        
#         if not member_email:
#             return jsonify({'success': False, 'error': 'Email is required'}), 400
        
#         try:
#             members_list = json.loads(project.members) if project.members else []
#         except:
#             members_list = []
        
#         if member_email in members_list:
#             return jsonify({'success': False, 'error': 'Member already in project'}), 400
        
#         members_list.append(member_email)
#         project.members = json.dumps(members_list)
        
#         # Send notification
#         invited_user = User.query.filter_by(email=member_email).first()
#         if invited_user:
#             notification = CollaborationRequest(
#                 from_user_id=user.id,
#                 to_email=member_email,
#                 to_user_id=invited_user.id,
#                 message=f'{user.email} added you to project "{project.name}" (project_id:{project.id})',
#                 request_type='project_invitation',
#                 status='pending'
#             )
#             db.session.add(notification)
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': f'{member_email} added to project successfully',
#             'members': members_list
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500


# @team_bp.route('/projects/<project_id>/members/<member_email>', methods=['DELETE'])
# @jwt_required()
# def remove_project_member(project_id, member_email):
#     """Remove a member from a project"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         project = TeamProject.query.filter_by(
#             id=project_id,
#             owner_id=user.id
#         ).first()
        
#         if not project:
#             return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
#         try:
#             members_list = json.loads(project.members) if project.members else []
#         except:
#             members_list = []
        
#         if member_email not in members_list:
#             return jsonify({'success': False, 'error': 'Member not in project'}), 404
        
#         members_list.remove(member_email)
#         project.members = json.dumps(members_list)
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': f'{member_email} removed from project'
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/projects/<project_id>/members', methods=['POST'])
# @jwt_required()
# def add_project_member(project_id):
#     """Add a member to a project and send notification"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Only project owner can add members
#         project = TeamProject.query.filter_by(
#             id=project_id,
#             owner_id=user.id
#         ).first()
        
#         if not project:
#             return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
#         data = request.get_json()
#         member_email = data.get('email', '').strip().lower()
        
#         if not member_email:
#             return jsonify({'success': False, 'error': 'Email is required'}), 400
        
#         # Add email to project members JSON array
#         try:
#             members_list = json.loads(project.members) if project.members else []
#         except:
#             members_list = []
        
#         if member_email in members_list:
#             return jsonify({'success': False, 'error': 'Member already in project'}), 400
        
#         members_list.append(member_email)
#         project.members = json.dumps(members_list)
        
#         # Send notification to the member via CollaborationRequest
#         invited_user = User.query.filter_by(email=member_email).first()
#         if invited_user:
#             # Check if notification already exists
#             existing = CollaborationRequest.query.filter_by(
#                 from_user_id=user.id,
#                 to_email=member_email,
#                 request_type='project_invitation',
#                 status='pending'
#             ).filter(CollaborationRequest.message.contains(project.name)).first()
            
#             if not existing:
#                 notification = CollaborationRequest(
#                     from_user_id=user.id,
#                     to_email=member_email,
#                     to_user_id=invited_user.id,
#                     message=f'{user.email} added you to project "{project.name}" (project_id:{project.id})',
#                     request_type='project_invitation',
#                     status='pending'
#                 )
#                 db.session.add(notification)
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': f'{member_email} added to project successfully',
#             'members': members_list
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/projects/<project_id>/members/<member_email>', methods=['DELETE'])
# @jwt_required()
# def remove_project_member(project_id, member_email):
#     """Remove a member from a project"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         project = TeamProject.query.filter_by(
#             id=project_id,
#             owner_id=user.id
#         ).first()
        
#         if not project:
#             return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        
#         try:
#             members_list = json.loads(project.members) if project.members else []
#         except:
#             members_list = []
        
#         if member_email not in members_list:
#             return jsonify({'success': False, 'error': 'Member not in project'}), 404
        
#         members_list.remove(member_email)
#         project.members = json.dumps(members_list)
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': f'{member_email} removed from project'
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/projects/<project_id>/tasks', methods=['PUT'])
# @jwt_required()
# def update_project_tasks(project_id):
#     """Update tasks for a project"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Get project - user must be owner or member
#         project = TeamProject.query.get(project_id)
        
#         if not project:
#             return jsonify({'success': False, 'error': 'Project not found'}), 404
        
#         # Check if user is owner or member
#         is_owner = project.owner_id == user.id
#         is_member = False
        
#         try:
#             members_list = json.loads(project.members) if project.members else []
#             is_member = user.email in members_list
#         except:
#             pass
        
#         if not is_owner and not is_member:
#             return jsonify({'success': False, 'error': 'Not authorized'}), 403
        
#         data = request.get_json()
#         tasks = data.get('tasks', [])
        
#         # Store tasks in description field as JSON (temporary solution)
#         # In production, you'd want a separate tasks table
#         project.description = json.dumps({
#             'description': json.loads(project.description).get('description', '') if project.description and project.description.startswith('{') else project.description or '',
#             'tasks': tasks
#         })
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Tasks updated successfully'
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# # ==================== COLLABORATION REQUESTS ====================

# @team_bp.route('/requests', methods=['GET'])
# @jwt_required()
# def get_requests():
#     """Get all pending requests for the current user (as recipient)"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Get requests sent TO this user's email
#         requests = CollaborationRequest.query.filter_by(
#             to_email=user.email,
#             status='pending'
#         ).all()
        
#         # Enrich with sender information
#         result = []
#         for req in requests:
#             req_dict = req.to_dict()
#             sender = User.query.get(req.from_user_id)
#             if sender:
#                 req_dict['from_email'] = sender.email
#                 req_dict['from_name'] = sender.display_name or sender.email
#             result.append(req_dict)
        
#         return jsonify({
#             'success': True,
#             'requests': result
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/requests/sent', methods=['GET'])
# @jwt_required()
# def get_sent_requests():
#     """Get all requests sent BY the current user"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         requests = CollaborationRequest.query.filter_by(
#             from_user_id=user.id
#         ).all()
        
#         return jsonify({
#             'success': True,
#             'requests': [r.to_dict() for r in requests]
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/requests/<request_id>/accept', methods=['POST'])
# @jwt_required()
# def accept_request(request_id):
#     """Accept a collaboration request or project invitation"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Find request
#         req = CollaborationRequest.query.filter_by(
#             id=request_id,
#             to_email=user.email,
#             status='pending'
#         ).first()
        
#         if not req:
#             return jsonify({'success': False, 'error': 'Request not found'}), 404
        
#         # Update request status
#         req.status = 'accepted'
#         req.responded_at = datetime.now(timezone.utc)
#         req.to_user_id = user.id
        
#         if req.request_type == 'join_team':
#             # Update team member status if exists
#             member = TeamMember.query.filter_by(
#                 owner_id=req.from_user_id,
#                 member_email=user.email
#             ).first()
            
#             if member:
#                 member.status = 'active'
#                 member.member_id = user.id
        
#         elif req.request_type == 'project_invitation':
#             # Extract project_id from message
#             import re
#             match = re.search(r'project_id:(\S+)', req.message or '')
#             if match:
#                 project_id = match.group(1)
#                 project = TeamProject.query.get(project_id)
                
#                 if project:
#                     try:
#                         members_list = json.loads(project.members) if project.members else []
#                     except:
#                         members_list = []
                    
#                     if user.email not in members_list:
#                         members_list.append(user.email)
#                         project.members = json.dumps(members_list)
                    
#                     # Notify the project leader
#                     leader = User.query.get(project.owner_id)
#                     if leader:
#                         leader_notification = CollaborationRequest(
#                             from_user_id=user.id,
#                             to_email=leader.email,
#                             to_user_id=leader.id,
#                             message=f'{user.email} accepted your invitation and joined project "{project.name}"',
#                             request_type='member_joined',
#                             status='pending'
#                         )
#                         db.session.add(leader_notification)
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Request accepted successfully',
#             'request_type': req.request_type
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/requests/<request_id>/reject', methods=['POST'])
# @jwt_required()
# def reject_request(request_id):
#     """Reject a collaboration request"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Find request
#         req = CollaborationRequest.query.filter_by(
#             id=request_id,
#             to_email=user.email,
#             status='pending'
#         ).first()
        
#         if not req:
#             return jsonify({'success': False, 'error': 'Request not found'}), 404
        
#         # Update request status
#         req.status = 'rejected'
#         req.responded_at = datetime.now(timezone.utc)
#         req.to_user_id = user.id
        
#         # Remove team member if exists
#         member = TeamMember.query.filter_by(
#             owner_id=req.from_user_id,
#             member_email=user.email
#         ).first()
        
#         if member:
#             db.session.delete(member)
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Request rejected'
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# # ==================== STATS ====================

# @team_bp.route('/stats', methods=['GET'])
# @jwt_required()
# def get_team_stats():
#     """Get team collaboration statistics"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         members_count = TeamMember.query.filter_by(owner_id=user.id).count()
#         projects_count = TeamProject.query.filter_by(owner_id=user.id).count()
#         pending_requests = CollaborationRequest.query.filter_by(
#             to_email=user.email,
#             status='pending'
#         ).count()
        
#         # Calculate shared content
#         projects = TeamProject.query.filter_by(owner_id=user.id).all()
#         shared_content = sum(p.content_count for p in projects)
        
#         return jsonify({
#             'success': True,
#             'stats': {
#                 'team_members': members_count + 1,  # +1 for owner
#                 'active_projects': projects_count,
#                 'shared_content': shared_content,
#                 'pending_requests': pending_requests
#             }
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# # ==================== NOTIFICATIONS ====================

# @team_bp.route('/notifications/task', methods=['POST'])
# @jwt_required()
# def send_task_notification():
#     """Send task assignment notification to a team member"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         data = request.get_json()
#         assignee_email = data.get('assignee_email', '').strip().lower()
#         task_title = data.get('task_title', '')
#         project_name = data.get('project_name', '')
#         project_id = data.get('project_id', '')
#         notification_type = data.get('type', 'task_assigned')  # 'task_assigned' or 'task_completed'
        
#         if not assignee_email:
#             return jsonify({'success': False, 'error': 'Assignee email required'}), 400
        
#         assignee_user = User.query.filter_by(email=assignee_email).first()
#         if not assignee_user:
#             return jsonify({'success': False, 'error': 'User not found'}), 404
        
#         if notification_type == 'task_assigned':
#             message = f'New task assigned to you: "{task_title}" in project "{project_name}" (project_id:{project_id})'
#             req_type = 'task_assignment'
#         else:
#             message = f'Task completed: "{task_title}" was completed by {user.email} in project "{project_name}"'
#             req_type = 'task_completed'
        
#         notification = CollaborationRequest(
#             from_user_id=user.id,
#             to_email=assignee_email,
#             to_user_id=assignee_user.id,
#             message=message,
#             request_type=req_type,
#             status='pending'
#         )
#         db.session.add(notification)
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Notification sent'
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/notifications', methods=['GET'])
# @jwt_required()
# def get_notifications():
#     """Get all notifications for current user"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         notifications = CollaborationRequest.query.filter_by(
#             to_email=user.email,
#             status='pending'
#         ).order_by(CollaborationRequest.created_at.desc()).all()
        
#         result = []
#         for notif in notifications:
#             notif_dict = notif.to_dict()
#             sender = User.query.get(notif.from_user_id)
#             if sender:
#                 notif_dict['from_email'] = sender.email
#                 notif_dict['from_name'] = sender.display_name or sender.email
#             result.append(notif_dict)
        
#         return jsonify({
#             'success': True,
#             'notifications': result
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/notifications/<notification_id>/read', methods=['POST'])
# @jwt_required()
# def mark_notification_read(notification_id):
#     """Mark a notification as read"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         notif = CollaborationRequest.query.filter_by(
#             id=notification_id,
#             to_email=user.email
#         ).first()
        
#         if notif:
#             notif.status = 'read'
#             db.session.commit()
        
#         return jsonify({'success': True}), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# # ==================== TEAM CHAT ====================

# @team_bp.route('/chat/conversations', methods=['GET'])
# @jwt_required()
# def get_conversations():
#     """Get all chat conversations for the current user"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Get all team members (both owned and member of)
#         owned_members = TeamMember.query.filter_by(
#             owner_id=user.id,
#             status='active'
#         ).all()
        
#         member_of = TeamMember.query.filter_by(
#             member_id=user.id,
#             status='active'
#         ).all()
        
#         conversations = []
        
#         # Add conversations with owned members
#         for member in owned_members:
#             if member.member_id:
#                 other_user = User.query.get(member.member_id)
#                 if other_user:
#                     # Get last message
#                     last_message = TeamChat.query.filter(
#                         or_(
#                             and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user.id),
#                             and_(TeamChat.sender_id == other_user.id, TeamChat.receiver_id == user.id)
#                         )
#                     ).order_by(TeamChat.created_at.desc()).first()
                    
#                     # Count unread messages
#                     unread_count = TeamChat.query.filter_by(
#                         sender_id=other_user.id,
#                         receiver_id=user.id,
#                         is_read=False
#                     ).count()
                    
#                     conversations.append({
#                         'user_id': other_user.id,
#                         'user_email': other_user.email,
#                         'user_name': other_user.display_name or other_user.email,
#                         'last_message': last_message.message if last_message else None,
#                         'last_message_time': last_message.created_at.isoformat() if last_message else None,
#                         'unread_count': unread_count
#                     })
        
#         # Add conversations with team owners
#         for membership in member_of:
#             owner = User.query.get(membership.owner_id)
#             if owner:
#                 # Get last message
#                 last_message = TeamChat.query.filter(
#                     or_(
#                         and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == owner.id),
#                         and_(TeamChat.sender_id == owner.id, TeamChat.receiver_id == user.id)
#                     )
#                 ).order_by(TeamChat.created_at.desc()).first()
                
#                 # Count unread messages
#                 unread_count = TeamChat.query.filter_by(
#                     sender_id=owner.id,
#                     receiver_id=user.id,
#                     is_read=False
#                 ).count()
                
#                 conversations.append({
#                     'user_id': owner.id,
#                     'user_email': owner.email,
#                     'user_name': owner.display_name or owner.email,
#                     'last_message': last_message.message if last_message else None,
#                     'last_message_time': last_message.created_at.isoformat() if last_message else None,
#                     'unread_count': unread_count
#                 })
        
#         return jsonify({
#             'success': True,
#             'conversations': conversations
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/chat/<other_user_id>', methods=['GET'])
# @jwt_required()
# def get_chat_messages(other_user_id):
#     """Get chat messages between current user and another user"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Verify they are team members
#         is_team_member = TeamMember.query.filter(
#             or_(
#                 and_(TeamMember.owner_id == user.id, TeamMember.member_id == other_user_id),
#                 and_(TeamMember.owner_id == other_user_id, TeamMember.member_id == user.id)
#             ),
#             TeamMember.status == 'active'
#         ).first()
        
#         if not is_team_member:
#             return jsonify({'success': False, 'error': 'Not team members'}), 403
        
#         # Get messages
#         messages = TeamChat.query.filter(
#             or_(
#                 and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user_id),
#                 and_(TeamChat.sender_id == other_user_id, TeamChat.receiver_id == user.id)
#             )
#         ).order_by(TeamChat.created_at.asc()).all()
        
#         # Mark messages as read
#         TeamChat.query.filter_by(
#             sender_id=other_user_id,
#             receiver_id=user.id,
#             is_read=False
#         ).update({'is_read': True})
#         db.session.commit()
        
#         # Get other user info
#         other_user = User.query.get(other_user_id)
        
#         return jsonify({
#             'success': True,
#             'messages': [m.to_dict() for m in messages],
#             'other_user': {
#                 'id': other_user.id,
#                 'email': other_user.email,
#                 'name': other_user.display_name or other_user.email
#             } if other_user else None
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/chat/<other_user_id>', methods=['POST'])
# @jwt_required()
# def send_chat_message(other_user_id):
#     """Send a chat message to another team member"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Verify they are team members
#         is_team_member = TeamMember.query.filter(
#             or_(
#                 and_(TeamMember.owner_id == user.id, TeamMember.member_id == other_user_id),
#                 and_(TeamMember.owner_id == other_user_id, TeamMember.member_id == user.id)
#             ),
#             TeamMember.status == 'active'
#         ).first()
        
#         if not is_team_member:
#             return jsonify({'success': False, 'error': 'Not team members'}), 403
        
#         data = request.get_json()
#         message_text = data.get('message', '').strip()
        
#         if not message_text:
#             return jsonify({'success': False, 'error': 'Message is required'}), 400
        
#         # Create message
#         message = TeamChat(
#             sender_id=user.id,
#             receiver_id=other_user_id,
#             message=message_text,
#             is_read=False
#         )
        
#         db.session.add(message)
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': message.to_dict()
#         }), 201
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/chat/<other_user_id>/clear', methods=['DELETE'])
# @jwt_required()
# def clear_chat(other_user_id):
#     """Clear all messages in a conversation (for current user only)"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Delete all messages between these two users
#         TeamChat.query.filter(
#             or_(
#                 and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user_id),
#                 and_(TeamChat.sender_id == other_user_id, TeamChat.receiver_id == user.id)
#             )
#         ).delete()
        
#         db.session.commit()
        
#         return jsonify({
#             'success': True,
#             'message': 'Chat cleared successfully'
#         }), 200
        
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'success': False, 'error': str(e)}), 500

# @team_bp.route('/chat/<other_user_id>/export', methods=['GET'])
# @jwt_required()
# def export_chat(other_user_id):
#     """Export chat history as JSON"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         if not user:
#             return jsonify({'error': 'User not found'}), 404
        
#         # Get all messages
#         messages = TeamChat.query.filter(
#             or_(
#                 and_(TeamChat.sender_id == user.id, TeamChat.receiver_id == other_user_id),
#                 and_(TeamChat.sender_id == other_user_id, TeamChat.receiver_id == user.id)
#             )
#         ).order_by(TeamChat.created_at.asc()).all()
        
#         # Get other user info
#         other_user = User.query.get(other_user_id)
        
#         export_data = {
#             'conversation_with': other_user.email if other_user else 'Unknown',
#             'exported_at': datetime.now(timezone.utc).isoformat(),
#             'message_count': len(messages),
#             'messages': [m.to_dict() for m in messages]
#         }
        
#         return jsonify({
#             'success': True,
#             'data': export_data
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500



from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, TeamMember, TeamProject, CollaborationRequest, TeamChat
from datetime import datetime, timezone
from sqlalchemy import or_, and_
import json
import re

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

@team_bp.route('/members/invite', methods=['POST'])
@jwt_required()
def invite_member():
    try:
        current_user_id = get_jwt_identity()
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
        return jsonify({'success': True, 'projects': [p.to_dict() for p in all_user_projects]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    try:
        current_user_id = get_jwt_identity()
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
        return jsonify({'success': True, 'message': 'Project created successfully', 'project': project.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    try:
        current_user_id = get_jwt_identity()
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
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        project = TeamProject.query.filter_by(id=project_id, owner_id=user.id).first()
        if not project:
            return jsonify({'success': False, 'error': 'Project not found or not authorized'}), 404
        data = request.get_json()
        member_email = data.get('email', '').strip().lower()
        if not member_email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        try:
            members_list = json.loads(project.members) if project.members else []
        except:
            members_list = []
        if member_email in members_list:
            return jsonify({'success': False, 'error': 'Member already in project'}), 400
        members_list.append(member_email)
        project.members = json.dumps(members_list)
        invited_user = User.query.filter_by(email=member_email).first()
        if invited_user:
            notification = CollaborationRequest(
                from_user_id=user.id,
                to_email=member_email,
                to_user_id=invited_user.id,
                message=f'{user.email} added you to project "{project.name}" (project_id:{project.id})',
                request_type='project_invitation',
                status='pending'
            )
            db.session.add(notification)
        db.session.commit()
        return jsonify({'success': True, 'message': f'{member_email} added to project successfully', 'members': members_list}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@team_bp.route('/projects/<project_id>/members/<member_email>', methods=['DELETE', 'OPTIONS'])
@jwt_required(optional=True)
def remove_project_member(project_id, member_email):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        current_user_id = get_jwt_identity()
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
        try:
            existing = json.loads(project.description) if project.description and project.description.startswith('{') else {}
            desc_text = existing.get('description', project.description or '')
        except:
            desc_text = project.description or ''
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

@team_bp.route('/requests/<request_id>/accept', methods=['POST'])
@jwt_required()
def accept_request(request_id):
    try:
        current_user_id = get_jwt_identity()
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
            match = re.search(r'project_id:(\S+)', req.message or '')
            if match:
                project_id = match.group(1).rstrip(')')
                project = TeamProject.query.get(project_id)
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

@team_bp.route('/requests/<request_id>/reject', methods=['POST'])
@jwt_required()
def reject_request(request_id):
    try:
        current_user_id = get_jwt_identity()
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


































































