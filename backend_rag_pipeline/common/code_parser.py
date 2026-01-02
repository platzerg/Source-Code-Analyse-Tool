import os
from typing import List, Dict, Any
import magic

class CodeParser:
    def __init__(self):
        self.supported_extensions = {
            '.py', '.ts', '.js', '.tsx', '.jsx', '.c', '.cpp', '.h', '.hpp',
            '.go', '.rs', '.java', '.kt', '.php', '.rb', '.cs', '.sh', '.bash',
            '.sql', '.html', '.css', '.md', '.json', '.yaml', '.yml', '.env'
        }
        self.mime = magic.Magic(mime=True)

    def is_supported(self, file_path: str) -> bool:
        """Checks if the file extension or MIME type is supported for analysis."""
        _, ext = os.path.splitext(file_path.lower())
        if ext in self.supported_extensions:
            return True
        
        try:
            mime_type = self.mime.from_file(file_path)
            if mime_type.startswith('text/'):
                return True
        except:
            pass
            
        return False

    def extract_code(self, file_path: str) -> str:
        """Reads code from a file, handling different encodings."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return ""

    def get_repo_files(self, repo_path: str) -> List[str]:
        """Returns a list of all supported code files in the repository."""
        code_files = []
        exclude_dirs = {'.git', 'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build'}
        
        for root, dirs, files in os.walk(repo_path):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                file_path = os.path.join(root, file)
                if self.is_supported(file_path):
                    code_files.append(file_path)
                    
        return code_files
