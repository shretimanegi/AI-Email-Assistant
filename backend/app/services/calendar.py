from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from app.config import settings

class CalendarService:
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
                if not self.creds.valid:
                    self.creds.refresh(Request())
            except Exception as e:
                print(f"Error initializing Calendar credentials: {e}")
                self.creds = None

    def _get_service(self):
        if not self.creds:
            return None
        return build("calendar", "v3", credentials=self.creds)

    def get_busy_slots(self, start_time: datetime, end_time: datetime) -> List[Dict[str, str]]:
        """Query primary calendar for busy time blocks."""
        service = self._get_service()
        if not service:
            return self._get_mock_busy_slots(start_time, end_time)

        try:
            body = {
                "timeMin": start_time.isoformat() + "Z",
                "timeMax": end_time.isoformat() + "Z",
                "items": [{"id": "primary"}]
            }
            freebusy = service.freebusy().query(body=body).execute()
            return freebusy.get("calendars", {}).get("primary", {}).get("busy", [])
        except Exception as e:
            print(f"Error querying FreeBusy Calendar API: {e}")
            return self._get_mock_busy_slots(start_time, end_time)

    def create_meeting(self, summary: str, start_time: datetime, end_time: datetime, attendees: List[str] = None, description: str = "") -> Optional[Dict[str, Any]]:
        """Schedule a new calendar event."""
        service = self._get_service()
        if not service:
            print(f"[MOCK CALENDAR] Booking event: '{summary}' from {start_time} to {end_time} with {attendees}")
            return {
                "id": "mock-evt-12345",
                "htmlLink": "https://calendar.google.com/calendar/r/eventedit",
                "summary": summary,
                "start": {"dateTime": start_time.isoformat()},
                "end": {"dateTime": end_time.isoformat()}
            }

        try:
            event = {
                "summary": summary,
                "description": description,
                "start": {
                    "dateTime": start_time.isoformat() if start_time.tzinfo else (start_time.replace(tzinfo=timezone.utc)).isoformat(),
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": end_time.isoformat() if end_time.tzinfo else (end_time.replace(tzinfo=timezone.utc)).isoformat(),
                    "timeZone": "UTC",
                },
                "attendees": [{"email": email} for email in attendees] if attendees else [],
                "conferenceData": {
                    "createRequest": {
                        "requestId": "meet-" + str(int(start_time.timestamp())),
                        "conferenceSolutionKey": {"type": "hangoutsMeet"}
                    }
                }
            }
            
            created_event = service.events().insert(
                calendarId="primary",
                body=event,
                conferenceDataVersion=1
            ).execute()
            
            return created_event
        except Exception as e:
            print(f"Error creating calendar event: {e}")
            return None

    def _get_mock_busy_slots(self, start_time: datetime, end_time: datetime) -> List[Dict[str, str]]:
        # Simulate meeting events on primary calendar for tomorrow
        tomorrow = datetime.utcnow() + timedelta(days=1)
        
        # Format strings
        def fmt(h, m):
            dt = datetime(tomorrow.year, tomorrow.month, tomorrow.day, h, m)
            return dt.isoformat() + "Z"
            
        return [
            {"start": fmt(10, 0), "end": fmt(11, 0)},
            {"start": fmt(13, 0), "end": fmt(14, 30)}
        ]
