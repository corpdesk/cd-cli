/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"

	"github.com/georemo/cd-core/sys/base"
	"github.com/spf13/cobra"
)

type ICdRequest struct {
	ctx  string
	m    string
	c    string
	a    string
	dat  string
	args string
}

var jsonMap map[string]interface{}
var jReq ICdRequest

// func jToStr(field string) string {
// 	f := jsonMap[field]
// 	// fmt.Println("ctx:", ctx)
// 	biteF, err := json.Marshal(f)
// 	if err != nil {
// 		fmt.Fprintln(os.Stderr, err)
// 		return ""
// 	} else {
// 		// fmt.Println("biteF:", biteF)
// 		return string(biteF[:])
// 	}

// }

// func removeQt(s string) string {
// 	return s[1 : len(s)-1]
// }

// func Run(req string) string {

// 	fmt.Println("b::Run()/Processing JSON...")

// 	r := json.Unmarshal([]byte(req), &jsonMap)
// 	if r == nil {
// 		fmt.Println("Successfull JSON encoding")
// 		fmt.Println(jsonMap)

// 		jReq.ctx = removeQt(jToStr("ctx"))
// 		jReq.m = removeQt(jToStr("m"))
// 		jReq.c = removeQt(jToStr("c"))
// 		jReq.a = removeQt(jToStr("a"))
// 		jReq.dat = removeQt(jToStr("dat"))

// 	} else {
// 		fmt.Println("Error:", r)
// 	}

// 	/////////////////////////////////////
// 	// Name of the plugin to load
// 	fmt.Println("Controller:", jReq.c)
// 	pluginName := jReq.c + ".so" // Replace with the name of your plugin file
// 	fmt.Println("pluginName:", pluginName)

// 	// Load the plugin
// 	p, err := plugin.Open(pluginName)
// 	if err != nil {
// 		fmt.Println("Error opening plugin:", err)
// 		return "{}"
// 	}

// 	// Look up the symbol (function) in the plugin
// 	runSymbol, err := p.Lookup(jReq.a)
// 	if err != nil {
// 		fmt.Println("Error finding symbol in plugin:", err)
// 		return "{}"
// 	}

// 	// Assert that the symbol implements the PluginInterface
// 	var pluginFunc func(string) (string, error)
// 	pluginFunc, ok := runSymbol.(func(string) (string, error))
// 	if !ok {
// 		fmt.Println("Error: Symbol does not implement expected interface.")
// 		return "{}"
// 	}

// 	// Call the function in the plugin with input parameters
// 	resp, err := pluginFunc(jReq.dat)
// 	if err != nil {
// 		fmt.Println("Error calling plugin function:", err)
// 		return "{}"
// 	}

// 	fmt.Println("Plugin function returned:", resp)
// 	return resp
// }

// reqCmd represents the req command
var reqCmd = &cobra.Command{
	Use:   "req",
	Short: "'req' command accepts JSON string formated as ICdRequest",
	Long: `ICdRequest is based on standard corpdesk JSON input which is processed by the systam.
	Response is returned in JSON string formated as ICdResponse`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Number of args=", len(args))
		if len(args) > 1 {
			fmt.Println("Args are more than 1")
			return
		} else {
			var resp string = base.Run(args[0])
			fmt.Println("resp:", resp)
		}

	},
}

func init() {
	rootCmd.AddCommand(reqCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// reqCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// reqCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
