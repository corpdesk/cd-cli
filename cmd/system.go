package cmd

import (
	"fmt"
	"os/exec"
)

func SysExec(cmd string) (string, error) {
	// Command to execute (change this to your desired command)
	// cmd := "ls -l"

	// Execute the command
	output, err := exec.Command(cmd).Output()
	if err != nil {
		fmt.Println("Error executing command:", err)
		return "", err
	}

	// Print the output
	fmt.Println("Command output:")
	fmt.Println(string(output))
	return string(output), err
}
