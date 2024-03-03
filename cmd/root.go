/*
Copyright © 2024 Oremo Ojwang
*/
package cmd

import (
	"fmt"
	"os"

	"github.com/bradfitz/gomemcache/memcache"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string
var mc = memcache.New("localhost:11211")

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "cd-cli",
	Short: "A cli for initeracting with corpdesk system",
	Long: `The cli has a generic pattern of m,c,a,data as string options:
Input:
-------
m: module
c: controller
a: action
data: data passed to the function
The above is based on ICdRequest

Output:
-------
JSON respons of strucure ICdResponse`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	// Run: func(cmd *cobra.Command, args []string) { },
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	// Here you will define your flags and configuration settings.
	// Cobra supports persistent flags, which, if defined here,
	// will be global for your application.

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.cd-cli.yaml)")

	// Cobra also supports local flags, which will only run
	// when this action is called directly.
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		// Search config in home directory with name ".cd-cli" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigType("yaml")
		viper.SetConfigName(".cd-cli")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
	}
}
