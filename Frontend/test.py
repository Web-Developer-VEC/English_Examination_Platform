import os
import requests

SERVER_URL = "https://6061qm7h-6000.inc1.devtunnels.ms/upload-folder"

def send_folder(folder_name):

    base_path = os.path.abspath(folder_name)

    if not os.path.isdir(base_path):
        print("Folder not found:", base_path)
        return

    for root, _, files in os.walk(base_path):

        for filename in files:

            file_path = os.path.join(root, filename)

            # Keep folder structure
            relative_path = os.path.relpath(
                file_path,
                os.path.dirname(base_path)
            ).replace("\\", "/")

            print(f"Sending: {relative_path}")

            try:
                with open(file_path, "rb") as f:

                    files_data = {
                        "file": (
                            relative_path,
                            f,
                            "application/octet-stream"
                        )
                    }

                    response = requests.post(
                        SERVER_URL,
                        files=files_data,
                        timeout=600  # 10 min for big files
                    )

                    print(response.status_code, response.text)

            except Exception as e:
                print("Error:", e)


send_folder("Quiz-App")