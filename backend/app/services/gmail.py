import os
import base64
import email
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from app.config import settings

class GmailService:
    def __init__(self, refresh_token: Optional[str] = None):
        self.refresh_token = refresh_token
        self.creds = None
        if refresh_token and settings.GOOGLE_CLIENT_ID != "mock-client-id.apps.googleusercontent.com":
            try:
                self.creds = Credentials(
                    None,
                    refresh_token=refresh_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=settings.GOOGLE_CLIENT_ID,
                    client_secret=settings.GOOGLE_CLIENT_SECRET
                )
                # Refresh credentials if expired
                if not self.creds.valid:
                    self.creds.refresh(Request())
            except Exception as e:
                print(f"Error initializing Gmail credentials: {e}")
                self.creds = None

    def _get_service(self):
        if not self.creds:
            return None
        return build("gmail", "v1", credentials=self.creds)

    def fetch_recent_emails(self, max_results: int = 15, query: str = "") -> List[Dict[str, Any]]:
        service = self._get_service()
        if not service:
            return self._generate_mock_emails()

        try:
            results = service.users().messages().list(userId="me", maxResults=max_results, q=query).execute()
            messages = results.get("messages", [])
            
            emails = []
            for msg_meta in messages:
                email_detail = self.fetch_email_by_id(msg_meta["id"])
                if email_detail:
                    emails.append(email_detail)
            return emails
        except Exception as e:
            print(f"Error fetching emails from Gmail API: {e}")
            return self._generate_mock_emails()

    def fetch_email_by_id(self, message_id: str) -> Optional[Dict[str, Any]]:
        service = self._get_service()
        if not service:
            mock_emails = self._generate_mock_emails()
            for m in mock_emails:
                if m["id"] == message_id:
                    return m
            return None

        try:
            msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
            payload = msg.get("payload", {})
            headers = payload.get("headers", [])
            
            # Extract headers
            subject = self._get_header(headers, "Subject")
            sender = self._get_header(headers, "From")
            recipient = self._get_header(headers, "To")
            date_str = self._get_header(headers, "Date")
            
            # Parse Date
            try:
                # Basic parsing, fall back to current time
                received_at = email.utils.parsedate_to_datetime(date_str)
                # Ensure offset aware timezone is converted to utc
                received_at = received_at.astimezone(timezone.utc).replace(tzinfo=None)
            except Exception:
                received_at = datetime.utcnow()

            # Extract body
            body_text, body_html = self._parse_body(payload)

            return {
                "id": msg["id"],
                "thread_id": msg["threadId"],
                "subject": subject,
                "sender": sender,
                "recipient": recipient,
                "body_text": body_text,
                "body_html": body_html,
                "received_at": received_at,
                "is_read": "UNREAD" not in msg.get("labelIds", [])
            }
        except Exception as e:
            print(f"Error fetching email detail {message_id}: {e}")
            return None

    def send_reply(self, thread_id: str, to: str, subject: str, body_text: str) -> bool:
        service = self._get_service()
        if not service:
            print(f"[MOCK GMAIL] Sent reply to {to} on thread {thread_id} with body:\n{body_text}")
            return True

        try:
            message = MIMEText(body_text)
            message["to"] = to
            message["from"] = "me"
            message["subject"] = subject if subject.startswith("Re:") else f"Re: {subject}"
            message["threadId"] = thread_id

            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            service.users().messages().send(userId="me", body={"raw": raw_message, "threadId": thread_id}).execute()
            return True
        except Exception as e:
            print(f"Error sending reply to {to}: {e}")
            return False

    def _get_header(self, headers: List[Dict[str, str]], name: str) -> str:
        for header in headers:
            if header["name"].lower() == name.lower():
                return header["value"]
        return ""

    def _parse_body(self, payload: Dict[str, Any]) -> tuple[str, str]:
        body_text = ""
        body_html = ""
        
        parts = payload.get("parts", [])
        if not parts:
            data = payload.get("body", {}).get("data", "")
            if data:
                decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                mime_type = payload.get("mimeType", "")
                if "text/html" in mime_type:
                    body_html = decoded
                else:
                    body_text = decoded
            return body_text, body_html

        for part in parts:
            mime_type = part.get("mimeType", "")
            data = part.get("body", {}).get("data", "")
            if data:
                decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                if "text/plain" in mime_type:
                    body_text = decoded
                elif "text/html" in mime_type:
                    body_html = decoded
            
            # Recurse if nested parts exist
            if part.get("parts"):
                nested_text, nested_html = self._parse_body(part)
                body_text = body_text or nested_text
                body_html = body_html or nested_html
                
        return body_text, body_html

    def _generate_mock_emails(self) -> List[Dict[str, Any]]:
        # High quality realistic mockup email data
        return [
            {
                "id": "msg-001",
                "thread_id": "thread-001",
                "subject": "Quick synchronization regarding the marketing campaign launch?",
                "sender": "Sarah Jenkins <sarah.jenkins@growthflow.io>",
                "recipient": "me@mailmind.ai",
                "body_text": "Hi team,\n\nI was hoping we could jump on a quick call tomorrow afternoon to align on the final items for the growth marketing campaign. Let me know if you are free at 2:00 PM EST or 4:00 PM EST. Otherwise, let me know when works for you.\n\nBest,\nSarah",
                "body_html": "<p>Hi team,</p><p>I was hoping we could jump on a quick call tomorrow afternoon to align on the final items for the growth marketing campaign. Let me know if you are free at 2:00 PM EST or 4:00 PM EST. Otherwise, let me know when works for you.</p><p>Best,<br>Sarah</p>",
                "received_at": datetime.utcnow(),
                "is_read": False
            },
            {
                "id": "msg-002",
                "thread_id": "thread-002",
                "subject": "Invoice #INV-2026-9812 - Outstanding Payment Details",
                "sender": "Billing Department <billing@acme-corp.com>",
                "recipient": "me@mailmind.ai",
                "body_text": "Dear customer,\n\nYour invoice #INV-2026-9812 is now ready for payment. The total amount due is $1,240.50, and the payment deadline is Friday, June 20, 2026. Please complete the wire transfer or use the credit card link to settle the balance.\n\nThank you,\nAcme Corp Support",
                "body_html": "<p>Dear customer,</p><p>Your invoice #INV-2026-9812 is now ready for payment. The total amount due is <strong>$1,240.50</strong>, and the payment deadline is <strong>Friday, June 20, 2026</strong>. Please complete the wire transfer or use the credit card link to settle the balance.</p><p>Thank you,<br>Acme Corp Support</p>",
                "received_at": datetime.utcnow(),
                "is_read": False
            },
            {
                "id": "msg-003",
                "thread_id": "thread-003",
                "subject": "Weekly Tech Digest: Trends in Agentic AI workflows, LangGraph vs Autogen",
                "sender": "Medium Tech News <digest@medium.com>",
                "recipient": "me@mailmind.ai",
                "body_text": "Hello Reader,\n\nHere are this week's top stories in AI Development:\n1. Designing Multi-Agent topologies with LangGraph\n2. Optimizing context windows for RAG retrieval\n3. The rise of local LLM models with Ollama.\n\nRead more inside.",
                "body_html": "<p>Hello Reader,</p><p>Here are this week's top stories in AI Development:</p><ul><li>Designing Multi-Agent topologies with LangGraph</li><li>Optimizing context windows for RAG retrieval</li><li>The rise of local LLM models with Ollama</li></ul><p>Read more inside.</p>",
                "received_at": datetime.utcnow(),
                "is_read": True
            },
            {
                "id": "msg-004",
                "thread_id": "thread-004",
                "subject": "Urgent Action Required: Confirm subscription changes to workspace",
                "sender": "Slack Notifications <no-reply@slack-mail.com>",
                "recipient": "me@mailmind.ai",
                "body_text": "Hi there,\n\nThis is a friendly reminder that your premium Slack workspace trial will expire in 3 days. Your credit card ending in 4111 will be billed $80.00 unless you change your preferences in workspace settings.",
                "body_html": "<p>Hi there,</p><p>This is a friendly reminder that your premium Slack workspace trial will expire in 3 days. Your credit card ending in 4111 will be billed $80.00 unless you change your preferences in workspace settings.</p>",
                "received_at": datetime.utcnow(),
                "is_read": False
            },
            {
                "id": "msg-005",
                "thread_id": "thread-005",
                "subject": "Dinner plans this weekend? Catching up",
                "sender": "John Doe <johndoe.friend@gmail.com>",
                "recipient": "me@mailmind.ai",
                "body_text": "Hey! Long time no see. Are you free to grab dinner this Saturday around 7 PM? Let me know, we have lots to catch up on!\n\nCheers,\nJohn",
                "body_html": "<p>Hey! Long time no see. Are you free to grab dinner this Saturday around 7 PM? Let me know, we have lots to catch up on!</p><p>Cheers,<br>John</p>",
                "received_at": datetime.utcnow(),
                "is_read": True
            }
        ]
