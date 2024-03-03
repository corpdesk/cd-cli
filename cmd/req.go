/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"log"
	"path/filepath"

	"encoding/json"
	"fmt"
	"os"

	"github.com/fsnotify/fsnotify"
	"github.com/tcp-x/cd-core/sys/base"

	"github.com/spf13/cobra"
)

type CdPlugin interface {
	Auth(string) string
	Create(string) string
	Read(string) string
	Update(string) string
	Delete(string) string
}

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

func watchPlugins() {
	// Specify the directory to monitor
	directory := "./plugins/"

	// Create a new watcher
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal("Error creating watcher:", err)
	}
	defer watcher.Close()

	// Add the directory to the watcher
	err = filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error accessing path %s: %v", path, err)
			return nil
		}
		if info.IsDir() {
			return watcher.Add(path)
		}
		return nil
	})
	if err != nil {
		log.Fatal("Error walking directory:", err)
	}

	// Start watching for events
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			log.Printf("Event: %s, Path: %s", event.Op, event.Name)

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Println("Error:", err)
		}
	}
}

func jToStr(field string) string {
	f := jsonMap[field]
	// fmt.Println("ctx:", ctx)
	biteF, err := json.Marshal(f)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return ""
	} else {
		// fmt.Println("biteF:", biteF)
		return string(biteF[:])
	}

}

func removeQt(s string) string {
	return s[1 : len(s)-1]
}

// func Run(req string) string {

// 	// watchPlugins()

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
// 	pluginName := "plugins/" + jReq.m + "/" + jReq.c + ".so" // Replace with the name of your plugin file
// 	fmt.Println("pluginName:", pluginName)

// 	///////////////////////////////////////

// 	/////////////////////////////////
// 	// plg, err := plugin.Open(pluginName)
// 	// if err != nil {
// 	// 	log.Fatalf("Failed to open plugin: %s", err)
// 	// }

// 	// // loookup the function
// 	// symbol, err := plg.Lookup("User")
// 	// if err != nil {
// 	// 	log.Fatalf("Failed to find plugin symbol 'Plugin': %s", err)
// 	// }

// 	// pluginInstance, ok := symbol.(Plugin)
// 	// if !ok {
// 	// 	log.Fatal("Symbol 'Plugin' does not implement the Plugin interface")
// 	// }

// 	// pluginInstance[Req.a](jReq.a)

// 	// ////////////////////////////

// 	// Load the plugin
// 	// Glob – Gets the plugin to be loaded
// 	// plugins, err := filepath.Glob(pluginName)
// 	// plugins, err := plugin.Open(pluginName)
// 	// if err != nil {
// 	// 	panic(err)
// 	// }
// 	// Open – Loads the plugin
// 	fmt.Printf("Loading plugin %s", pluginName)
// 	p, err := plugin.Open(pluginName)
// 	if err != nil {
// 		panic(err)
// 	}
// 	// // Lookup – Searches for a symbol name in the plugin
// 	// symbol, err := p.Lookup("Add")
// 	// if err != nil {
// 	// 	panic(err)
// 	// }
// 	// // symbol – Checks the function signature
// 	// addFunc, ok := symbol.(func(int, int) int)
// 	// if !ok {
// 	// 	panic("Plugin has no 'Add(int)int' function")
// 	// }
// 	// // Uses the function to return results
// 	// addition := addFunc(3, 4)
// 	// fmt.Printf("\nAddition is:%d\n", addition)

// 	////////////////////////////////////
// 	// Lookup – Searches for Action symbol name in the plugin
// 	symbolAx, errAuth := p.Lookup(jReq.a)
// 	if errAuth != nil {
// 		panic(errAuth)
// 	}

// 	// symbol – Checks the function signature
// 	f, ok := symbolAx.(func(string) string)
// 	if !ok {
// 		panic("Plugin has no 'f(string)string' function")
// 	}

// 	// Uses f() function to return results
// 	resp := f(jReq.dat)
// 	fmt.Printf("\nf() return is:%s\n", resp)

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
			if SessIsValid() {
				// Authenticat user and get a valid cdToken
				// base.Auth("userName", "pswd")
				fmt.Println("session is valid")
				// var resp string = Run(args[0])
				var resp string = base.ExecPlug(args[0])
				fmt.Println("resp:", resp)
			}

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
