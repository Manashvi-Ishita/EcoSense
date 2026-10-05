import os
import json

from flask import Flask, send_from_directory, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables

load_dotenv()

# Create Gemini client

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"]
)

# Create Flask application

app = Flask(
    __name__,
    static_folder="frontend",
    static_url_path=""
)

# Load EcoSense knowledge base

with open("knowledge_base.json", "r", encoding="utf-8") as f:
    knowledge_base = json.load(f)

# Serve the EcoSense frontend

@app.route("/")
def home():
    return send_from_directory(
        "frontend",
        "index.html"
    )

# Analyze waste image

@app.route("/analyze", methods=["POST"])
def analyze():

    # Check whether an image was sent
    if "image" not in request.files:

        return jsonify({
            "error": "No image was uploaded."
        }), 400

    image = request.files["image"]

    # Check that the uploaded file is not empty
    if image.filename == "":

        return jsonify({
            "error": "No image selected."
        }), 400

    try:

        # Read image
    
        image_bytes = image.read()

        mime_type = image.mimetype

        # Ask Gemini to identify the PRIMARY item
    
        response = client.models.generate_content(

            model="gemini-2.5-flash",

            contents=[

                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                ),

                """
                You are EcoSense, an AI-powered household
                waste identification system.

                Analyze the image and identify the PRIMARY
                waste item.

                Return ONLY the name of the primary item.

                Choose the closest item from this list:

                - Banana Peel
                - Vegetable Scraps
                - Paper
                - Cardboard Box
                - Plastic Bottle
                - Bread / Chips Packet
                - Pen / Stationery
                - Electrical Wire
                - Battery
                - Medicine Strip
                - Used Syringe / Insulin Needle
                - Sanitary Pad

                If the image does not clearly match one of
                these items, return:

                Unknown

                Do not provide disposal advice.
                Do not provide alternative uses.
                Do not provide explanations.
                """
            ]
        )
        # Extract Gemini result

        identified_item = response.text.strip()

        # Match Gemini result with knowledge base

        matched_key = None

        for key, item_data in knowledge_base.items():

            if (
                identified_item.lower()
                == item_data["item"].lower()
            ):

                matched_key = key

                break

        # Unknown item

        if matched_key is None:

            return jsonify({

                "success": True,

                "identified": False,

                "item": identified_item,

                "message":
                    "EcoSense could not confidently match "
                    "this item to its verified knowledge base.",

                "safety_note":
                    "Please follow your local waste-management "
                    "guidance for this item."

            })

        # Get verified information

        item_data = knowledge_base[matched_key]

        # Return result to frontend
        
        return jsonify({

            "success": True,

            "identified": True,

            "item": item_data["item"],

            "category": item_data["category"],

            "bin": item_data["bin"],

            "immediate_action":
                item_data["immediate_action"],

            "alternatives":
                item_data["alternatives"],

            "safety_level":
                item_data["safety_level"],

            "safety_note":
                item_data["safety_note"]

        })

    except Exception as e:

        print(
            "Error during image analysis:",
            e
        )

        return jsonify({
            "success": False,

            "error":
                "Something went wrong while analyzing "
                "the image."
        }), 500

# Start Server

if __name__ == "__main__":
    app.run(
        debug=True
    )