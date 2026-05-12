
import sys

def find_mismatch(filename):
    balance = 0
    with open(filename, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            for char in line:
                if char == '{':
                    balance += 1
                elif char == '}':
                    balance -= 1
            if balance < 0:
                print(f"Negative balance at line {i}: {balance}")
    print(f"Final balance: {balance}")

if __name__ == "__main__":
    find_mismatch(sys.argv[1])
