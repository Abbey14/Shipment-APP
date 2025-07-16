# BoE Co-pilot Backend

This directory contains the FastAPI-based RESTful server for the BoE Co-pilot application.

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create a virtual environment (recommended):**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4. **Set up your API Key:**
    - Rename the `.env.example` file to `.env`.
    - Open the new `.env` file and add your Google API key.
    ```
    GOOGLE_API_KEY="YOUR_API_KEY_HERE"
    ```

## Running the Server

To run the development server, use the following command from within the `backend` directory:

```bash
uvicorn main:app --reload
```

-   `uvicorn`: The ASGI server that runs the application.
-   `main:app`: Tells uvicorn to look for an object named `app` in the file `main.py`.
-   `--reload`: Automatically restarts the server whenever code changes are detected.

The API will be available at `http://127.0.0.1:8000`.

You can access the auto-generated API documentation at `http://127.0.0.1:8000/docs`.
