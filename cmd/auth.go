/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"bufio"
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// authCmd represents the auth command
var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "A brief description of your command",
	Long: `A longer description that spans multiple lines and likely contains examples
and usage of using your command. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("auth called")

		if SessIsValid() {
			// Authenticat user and get a valid cdToken
			// base.Auth("userName", "pswd")
			fmt.Println("session is valid")
		} else {
			// Prompt for username
			fmt.Print("Enter username: ")
			username, _ := bufio.NewReader(os.Stdin).ReadString('\n')
			username = username[:len(username)-1] // Remove newline character

			// Prompt for password
			fmt.Print("Enter password: ")
			password, _ := bufio.NewReader(os.Stdin).ReadString('\n')
			password = password[:len(password)-1] // Remove newline character

			// Generate session ID
			cdToken := Auth(username, password)

			// Verify credentials
			if cdToken != "" {
				// Set session ID as environment variable
				SessInit(cdToken)
				tstToken, err := SessIdGet()
				if err != nil {
					fmt.Println("Error getting session id", err)
				}
				fmt.Println("tstToken:", tstToken)
			} else {
				fmt.Println("Authentication failed. Invalid username or password.")
			}
		}

	},
}

func init() {
	rootCmd.AddCommand(authCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// authCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// authCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
