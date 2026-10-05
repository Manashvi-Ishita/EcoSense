import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"]
)

with open("test_waste.jpg", "rb") as f:
    image_bytes = f.read()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg"
        ),
        """
        You are EcoSense, an AI-powered household waste
        guidance system.

        Analyze the image and identify the PRIMARY waste item.

        Classify it into exactly ONE of these categories:
        - Organic / Compostable
        - Recyclable
        - Non-recyclable
        - Hazardous

        Determine the most appropriate immediate action.

        Also determine whether there is a SAFE and practical
        alternative use, reuse, repurpose, or composting option.

        IMPORTANT:
        - Do not invent unsafe reuse methods.
        - For hazardous items, prioritize safe disposal.
        - Only provide an alternative use when it is genuinely
          appropriate.
        - Do not make specific monetary savings claims.
        - Keep the guidance practical for a household user.
        """,
    ],
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema={
            "type": "OBJECT",
            "properties": {
                "item": {
                    "type": "STRING"
                },
                "category": {
                    "type": "STRING"
                },
                "immediate_action": {
                    "type": "STRING"
                },
                "bin": {
                    "type": "STRING"
                },
                "reason": {
                    "type": "STRING"
                },
                "alternative_use_available": {
                    "type": "BOOLEAN"
                },
                "alternative_use": {
                    "type": "STRING"
                },
                "procedure": {
                    "type": "ARRAY",
                    "items": {
                        "type": "STRING"
                    }
                },
                "potential_benefit": {
                    "type": "STRING"
                }
            },
            "required": [
                "item",
                "category",
                "immediate_action",
                "bin",
                "reason",
                "alternative_use_available",
                "alternative_use",
                "procedure",
                "potential_benefit"
            ]
        }
    )
)

print("\n--- EcoSense Structured AI Result ---")

data = json.loads(response.text)

for key, value in data.items():
    print(f"\n{key}: {value}")