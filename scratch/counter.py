
import sys

def count_chars(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            open_braces = content.count('{')
            close_braces = content.count('}')
            open_parens = content.count('(')
            close_parens = content.count(')')
            open_tags = content.count('<')
            close_tags = content.count('>')
            
            print(f"Open Braces: {open_braces}")
            print(f"Close Braces: {close_braces}")
            print(f"Open Parens: {open_parens}")
            print(f"Close Parens: {close_parens}")
            print(f"Open Tags: {open_tags}")
            print(f"Close Tags: {close_tags}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    count_chars(sys.argv[1])
