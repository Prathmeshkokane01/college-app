import os
os.system('cls' if os.name == 'nt' else 'clear')
size = int(input("Enter the size of the array: "))
arr = []
print("Enter", size, "numbers:")
for i in range(size):
    num = int(input(f"Element {i+1}: "))
    arr.append(num)
print("\nArray entered:", arr)
key = int(input("\nEnter the number to search: "))
print("\nChoose search type:")
print("1. Linear Search")
print("2. Binary Search")
choice = int(input("Enter your choice (1 or 2): "))
found = False
if choice == 1:
    print("\nPerforming Linear Search...")
    for i in range(len(arr)):
        if arr[i] == key:
            print("Element found at index:", i)
            found = True
            break
    if not found:
        print("Element not found.")

elif choice == 2:
    print("\nPerforming Binary Search...")
    arr.sort()
    print("Sorted array for Binary Search:", arr)
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == key:
            print("Element found at index:", mid)
            found = True
            break
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    if not found:
        print("Element not found.")

else:
    print("Invalid choice. Please enter 1 or 2.")
