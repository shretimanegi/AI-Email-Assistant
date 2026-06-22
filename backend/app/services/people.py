from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from app.config import settings

class PeopleService:
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
                print(f"Error initializing People API credentials: {e}")
                self.creds = None

    def _get_service(self):
        if not self.creds:
            return None
        return build("people", "v1", credentials=self.creds)

    def get_frequent_contacts(self) -> List[Dict[str, Any]]:
        service = self._get_service()
        if not service:
            return self._get_mock_contacts()

        try:
            # Query connections
            results = service.people().connections().list(
                resourceName="people/me",
                pageSize=10,
                personFields="names,emailAddresses,photos"
            ).execute()
            
            connections = results.get("connections", [])
            contacts = []
            
            for person in connections:
                names = person.get("names", [])
                emails = person.get("emailAddresses", [])
                photos = person.get("photos", [])
                
                name = names[0].get("displayName") if names else "Unknown Contact"
                email_addr = emails[0].get("value") if emails else None
                avatar = photos[0].get("url") if photos else None
                
                if email_addr:
                    contacts.append({
                        "name": name,
                        "email": email_addr,
                        "avatar": avatar,
                        "frequency": 1
                    })
            return contacts
        except Exception as e:
            print(f"Error listing people connections: {e}")
            return self._get_mock_contacts()

    def _get_mock_contacts(self) -> List[Dict[str, Any]]:
        return [
            {"name": "Sarah Jenkins", "email": "sarah.jenkins@growthflow.io", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", "frequency": 42},
            {"name": "Alex Mercer", "email": "alex.m@acme-corp.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", "frequency": 28},
            {"name": "Jane Doe", "email": "jane@company.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=jane", "frequency": 15},
            {"name": "David Miller", "email": "david.miller@financials.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=david", "frequency": 9}
        ]
