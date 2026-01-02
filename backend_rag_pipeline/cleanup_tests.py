import os
import shutil

files_to_delete = [
    'check_db.py',
    'verify_rag.py',
    'insert_test_repo.py',
    'data/test.txt'
]

for f in files_to_delete:
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f)
    if os.path.exists(path):
        os.remove(path)
        print(f"Deleted {f}")

# Keep the repos directory but empty it if needed? No, leave it for future runs.
# Shutil.rmtree('repos') if needed.
print("Cleanup complete.")
