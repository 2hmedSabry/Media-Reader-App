
import sys

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    for i, char in enumerate(content):
        if char == '{':
            stack.append(i)
        elif char == '}':
            if not stack:
                print(f"Extra '}}' found at index {i}")
                # Find line number
                line_count = content[:i].count('\n') + 1
                print(f"Line number: {line_count}")
                # Print context
                start = max(0, i-50)
                end = min(len(content), i+50)
                print(f"Context: {content[start:end]}")
                return
            stack.pop()
    
    if stack:
        print(f"Unmatched '{{' found at index {stack[-1]}")
        line_count = content[:stack[-1]].count('\n') + 1
        print(f"Line number: {line_count}")
    else:
        print("Balanced!")

if __name__ == "__main__":
    check_balance(sys.argv[1])
