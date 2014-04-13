package main

import (
	"github.com/go-martini/martini"
	_"github.com/mattn/go-sqlite3"
	"database/sql"
	"net/http"
	"encoding/json"
	"strings"
	"log"
	"strconv"
)

type Data struct{
	Id int `json:"id"`
	Uname string `json:"uname"`
	Iname string `json:"iname"`
	Date int `json:"date"`
	Amount int `json:"amount"`
	Categories []string `json:"categories"`
}

type Budget struct{
	Uname string `json:"uname"`
	Cname string `json:"cname"`
	Amount int `json:"amount"`
}

func main(){

	db, err := sql.Open("sqlite3", "./poverty.db")
	if err != nil {
		log.Fatal("Could not connect to database.")
	}
	defer db.Close()

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, uname TEXT, date INT, iname TEXT, amount INT)")
	if err != nil {
		log.Fatal("Could not create data table in database.")
	}

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS categories (tid INTEGER, cname TEXT)")
	if err != nil {
		log.Fatal("Could not create categories table in database.")
	}

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS budgets (uname TEXT, cname TEXT, amount INT)")
	if err != nil {
		log.Fatal("Could not create budgets table in database.")
	}

	m := martini.Classic()
	m.Use(martini.Static("frontend", martini.StaticOptions{Prefix: "/"}))

	m.Get("/data/get", func(params martini.Params, r *http.Request) string {
		rows, err := db.Query("SELECT id, uname, iname, date, amount FROM data WHERE uname = ? ORDER BY date DESC ", r.FormValue("uname"))

		if err != nil {
			log.Println("DATA:GET ERROR Could not query database for data.")
		}
		defer rows.Close()

		data := make([]Data, 0, 5)

		for rows.Next() {
			var d Data
			err = rows.Scan(&d.Id, &d.Uname, &d.Iname, &d.Date, &d.Amount)
			if err != nil {
				log.Println("DATA:GET ERROR Could not read returned data rows.")
			}

			rows2, err := db.Query("SELECT cname FROM categories WHERE tid = ?", d.Id)
			if err != nil {
				log.Println("DATA:GET ERROR Could not query database for categories.")
			}
			defer rows2.Close()

			var cs []string

			for rows2.Next() {
				var cname string
				err = rows2.Scan(&cname)
				if err != nil {
					log.Println("DATA:GET ERROR Could not read returned category rows.")
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
		var id int64
		id = -1;

		res, err := db.Exec("INSERT INTO data(uname, iname, date, amount) VALUES(?, ?, ?, ?)", r.FormValue("uname"), r.FormValue("iname"), r.FormValue("date"), r.FormValue("amount"))
		if err != nil {
			log.Println("DATA::ADD ERROR Unable to insert new record into data table.")
		} else {

			id, err = res.LastInsertId()
			if err != nil{
				log.Println("DATA::ADD ERROR Unable to get id of inserted row.")
			}

			cats := strings.Split(r.FormValue("categories"), ",")

			for _, cat := range cats{
				_, err = db.Exec("INSERT INTO categories (tid, cname) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE tid=? AND cname=?);", id, strings.TrimSpace(cat), id, strings.TrimSpace(cat))
				if err != nil {
					log.Println("DATA::ADD ERROR Could not insert categories.")
				}
			}
		}

		return "[{\"id\":" + strconv.FormatInt(id, 10) + "}]"
	})

	m.Get("/data/remove", func(params martini.Params, r *http.Request) string {
		ret := "\"SUCCESS\""

		_, err := db.Exec("DELETE FROM data WHERE id=?", r.FormValue("id"))
		if err != nil {
			log.Println("DATA:REMOVE ERROR Could not remove row from database.")
			ret = "\"FAIL\""
		}

		return ret
	})

	m.Get("/budget/add", func(params martini.Params, r *http.Request) string {
		ret := "\"SUCCESS\""

		_, err = db.Exec("INSERT INTO budgets (uname, cname, amount) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE uname=? AND cname=?);", r.FormValue("uname"), r.FormValue("cname"), r.FormValue("amount"), r.FormValue("uname"), r.FormValue("cname"))
		if err != nil {
			log.Println("BUDGET:ADD ERROR Unable to insert new record into budget table.")
			ret = "\"FAIL\""
		}

		return ret
	})

	m.Get("/budget/get", func(params martini.Params, r *http.Request) string {
		var resp string

		if r.FormValue("all") == "true" {
			rows, err := db.Query("SELECT cname, amount FROM budgets WHERE uname = ?", r.FormValue("uname"))
			if err != nil {
				log.Println("BUDGET:GET ERROR Could not get list of budgets.")
			}
			defer rows.Close()

			buds := make([]Budget, 0, 5)

			for rows.Next() {
				var bud Budget
				bud.Uname = r.FormValue("uname")

				err = rows.Scan(&bud.Cname, &bud.Amount)
				if err != nil {
					log.Println("BUDGET:GET ERROR Could not read rows of budgets.")
				}

				buds = append(buds, bud)
			}
			rows.Close()

			byt, err := json.Marshal(buds)
			if err != nil {
				log.Println("BUDGET:GET ERROR Could not produce JSON object of budgets.")
			}
			resp = string(byt)

		} else {
			rows, err := db.Query("SELECT amount FROM budgets WHERE uname = ? AND cname = ?", r.FormValue("uname"), r.FormValue("cname"))
			if err != nil {
				log.Println("BUDGET:GET ERROR Could not get list of budgets.")
			}
			defer rows.Close()

			buds := make([]Budget, 0, 5)

			for rows.Next() {
				var bud Budget
				bud.Uname = r.FormValue("uname")
				bud.Cname = r.FormValue("cname")

				err = rows.Scan(&bud.Amount)
				if err != nil {
					log.Println("BUDGET:GET ERROR Could not read rows of budgets.")
				}

				buds = append(buds, bud)
			}
			rows.Close()

			byt, err := json.Marshal(buds)
			if err != nil {
				log.Println("BUDGET:GET ERROR Could not produce JSON object of budgets.")
			}
			resp = string(byt)
		}
			return string(resp)
	})

	m.Get("/budget/remove", func(params martini.Params, r *http.Request) string {
		ret := "\"SUCCESS\""

		_, err = db.Exec("DELETE FROM budgets WHERE uname=? AND cname=?", r.FormValue("uname"), r.FormValue("cname"))
		if err != nil {
			log.Println("BUDGET:REMOVE ERROR Could not remove requested budget.")
			ret = "\"FAIL\""
		}

		return ret
	})

	m.Run()
}