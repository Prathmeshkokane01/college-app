#include<stdio.h>
#include<stdlib.h>
int main()
{
    int num1,num2;
    system("cls");
    printf("Enter Any Two Numbers:");
    scanf("%d %d",&num1,&num2);
    (num1>num2)?printf("Largest no is %d",num1):printf("Largest no is %d",num2);
    return 0;
}