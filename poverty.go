package main

import (
	//"fmt"
	"github.com/go-martini/martini"
	_"github.com/mattn/go-sqlite3"
	"database/sql"
	"net/http"
	"encoding/json"
	"strings"
)

type Data struct{
	Id int `json:"id"`
	Uname string `json:"uname"`
	Iname string `json:"iname"`
	Date int `json:"date"`
	Amount float64 `json:"amount"`
	Categories []string `json:"categories"`
}

func main(){

	db, err := sql.Open("sqlite3", "./poverty.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, uname TEXT, date INT, iname TEXT, amount REAL)")
	if err != nil {
		panic(err)
	}

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS categories (tid INTEGER, cname TEXT)")
	if err != nil {
		panic(err)
	}

	m := martini.Classic()
	m.Use(martini.Static("frontend", martini.StaticOptions{Prefix: "/"}))

	m.Get("/data/get", func(params martini.Params, r *http.Request) string {
		rows, err := db.Query("SELECT id, uname, iname, date, amount FROM data WHERE uname = ?", r.FormValue("uname"))
		if err != nil {
			panic(err)
		}
		defer rows.Close()

		data := make([]Data, 0, 5)

		for rows.Next() {
			var d Data
			err = rows.Scan(&d.Id, &d.Uname, &d.Iname, &d.Date, &d.Amount)
			if err != nil {
				panic(err)
			}

			rows2, err := db.Query("SELECT cname FROM categories WHERE tid = ?", d.Id)
			if err != nil {
				panic(err)
			}
			defer rows2.Close()

			var cs []string

			for rows2.Next() {
				var cname string
				err = rows2.Scan(&cname)
				if err != nil {
					panic(err)
				}
				cs = append(cs, cname)
			}
			rows2.Close()

			d.Categories = cs

			data = append(data, d)
		}
		rows.Close()

		e, _ := json.Marshal(data)

		return string(e)
	})

	m.Get("/data/add", func(params martini.Params, r *http.Request) string {
		res, err := db.Exec("INSERT INTO data(uname, iname, date, amount) VALUES(?, ?, ?, ?)", r.FormValue("uname"), r.FormValue("iname"), r.FormValue("date"), r.FormValue("amount"))
		if err != nil {
			panic(err)
		}

		id, err := res.LastInsertId()
		if err != nil{
			panic(err)
		}

		cats := strings.Split(r.FormValue("categories"), ",")

		for _, cat := range cats{
			_, err = db.Exec("INSERT INTO categories VALUES(?, ?)", id, cat)
			if err != nil {
				panic(err)
			}
		}

		return "meh"
	})

	m.Run()
}