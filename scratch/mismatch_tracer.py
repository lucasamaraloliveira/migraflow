
import sys

def find_mismatch(filename):
    balance = 0
    with open(filename, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if i >= 1927:
                for char in line:
                    if char == '{':
                        balance += 1
                    elif char == '}':
                        balance -= 1
                if i % 100 == 0 or i > 3480:
                    print(f"Line {i}, Balance: {balance}")
    print(f"Final balance from 1927: {balance}")

if __name__ == "__main__":
    find_mismatch(sys.argv[1])
