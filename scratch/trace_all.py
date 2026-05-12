
import sys

def trace_all(filename):
    balance = 0
    with open(filename, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if i >= 1927:
                for char in line:
                    if char == '{':
                        balance += 1
                    elif char == '}':
                        balance -= 1
                print(f"{i}: {balance}")

if __name__ == "__main__":
    trace_all(sys.argv[1])
