"""Chat API Routes - Persistent Alex Chat with History"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.mongodb_service import mongodb_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get all chat conversations for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get conversations from MongoDB
        conversations = mongodb_service.get_chat_conversations(user_id)
        
        return jsonify({
            'success': True,
            'conversations': conversations
        }), 200
        
    except Exception as e:
        logger.error(f"Get conversations error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get conversations'
        }), 500

@chat_bp.route('/conversations/<conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for a specific conversation"""
    try:
        user_id = get_jwt_identity()
        
        # Get messages from MongoDB
        messages = mongodb_service.get_chat_messages(user_id, conversation_id)
        
        return jsonify({
            'success': True,
            'messages': messages
        }), 200
        
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get messages'
        }), 500

@chat_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create a new chat conversation"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        title = data.get('title', 'New Chat')
        
        # Create conversation in MongoDB
        result = mongodb_service.create_chat_conversation(user_id, title)
        
        return jsonify(result), 201 if result['success'] else 400
        
    except Exception as e:
        logger.error(f"Create conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create conversation'
        }), 500

@chat_bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    """Send a message in a conversation"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        role = data.get('role', 'user')
        content = data.get('content', '')
        
        if not content:
            return jsonify({
                'success': False,
                'error': 'Message content is required'
            }), 400
        
        # Save message to MongoDB
        result = mongodb_service.save_chat_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        
        return jsonify(result), 201 if result['success'] else 400
        
    except Exception as e:
        logger.error(f"Send message error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to send message'
        }), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        user_id = get_jwt_identity()
        
        # Delete conversation from MongoDB
        result = mongodb_service.delete_chat_conversation(user_id, conversation_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        logger.error(f"Delete conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete conversation'
        }), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['PUT'])
@jwt_required()
def update_conversation(conversation_id):
    """Update conversation title"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        title = data.get('title')
        if not title:
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400
        
        # Update conversation in MongoDB
        result = mongodb_service.update_chat_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            title=title
        )
        
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        logger.error(f"Update conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update conversation'
        }), 500
