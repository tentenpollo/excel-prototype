import requests
import json

# --- CONFIGURATION ---
MY_API_KEY = "z_WVZMgkaEXgotyyetLguA"
ENDPOINT = "https://api.apollo.io/v1/mixed_people/api_search"

def get_5_ceos():
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": MY_API_KEY
    }

    payload = {
        "person_titles": ["CEO", "Chief Executive Officer"],
        "page": 1,
        "per_page": 5
    }

    try:
        print(f"🚀 Querying Apollo for 5 CEOs...")
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ SUCCESS! DATA RETRIEVED (0 Credits Used)\n")
            print(json.dumps(data, indent=4))
            
            # Summary for quick reading
            print("\n" + "="*50)
            print("QUICK SUMMARY")
            print("="*50)
            for person in data.get('people', []):
                name = f"{person.get('first_name')} {person.get('last_name')}"
                title = person.get('title')
                company = person.get('organization', {}).get('name')
                pid = person.get('id')
                print(f"• {name} | {title} at {company} (ID: {pid})")
                
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"🔌 Connection error: {e}")

if __name__ == "__main__":
    get_5_ceos()