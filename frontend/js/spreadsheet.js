var currentUser;
var transactions = [];
var categories = [];
var budgets = [];
var balance = 0;
var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var startDate = new Date();

$(document).ready(function() {
	if (localStorage.getItem("user") === null) {
		// TODO: make a better login thing...
		currentUser = prompt("username");
		localStorage.setItem("user", currentUser);
	} else {
		currentUser = localStorage.getItem("user");
	}

	// get transactions
	getInfo();

	makeChart();
	sumBox();

	// setup the add new item stuff
	$("#addItem").click(function(event) {
		event.preventDefault();

		$("#newItemRow").toggle();
	});

	$("#sumBoxForm").submit(function(event) {
		event.preventDefault();
		startDate = new Date($("#sumBoxDate").val());
		sumBox();
	});

	$("#newItem").submit(function(event) {
		event.preventDefault();

		var nItem = {
			date: (new Date($("#newItemDate").val())).getTime(),
			iname: $("#newItemName").val(),
			amount: $("#newItemPrice").val(),
			categories: $("#newItemTags").val(),
			uname: currentUser
		};

		$.get("/data/add", nItem, function() {});
		balance -= nItem.amount;
		$("#currentBalance").text("$" + balance);

		var cats = nItem.categories.split(',');
		$.each(cats, function(i, cat) {
			cat = cat.trim();

			if ($.inArray(cat, categories) === -1) {
				categories.push(cat);
			}
		});
		nItem.categories = cats;
		transactions.push(nItem);
		categories.sort();
		fillCategories();

		fillTable();


		$("#newItemDate").val("");
		$("#newItemName").val("");
		$("#newItemPrice").val("");
		$("#newItemTags").val("");

		$("#newItemRow").hide();
	});


	// setup and add new budget stuff
	$("#toggleBudgetForm").click(function(event) {
		event.preventDefault();
		$("#newBudgetRow").toggle();
	});

	$("#newBudget").submit(function(event) {
		event.preventDefault();

		if ($("budgetCategories").val() === "--") {
			alert("Please select a category");
			return;
		}

		var nBudget = {
			uname: currentUser,
			cname: $("#budgetCategories").val(),
			amount: $("#budgetBudget").val()
		};

		$.get('/budget/add', nBudget, function(data) {
			if (data !== '"SUCCESS"') {
				alert("no confirmation on adding budget. everything is terrible.");
			} else {
				budgets.push(nBudget);
				fillBudgetTable();
			}
		});


		$("#budgetBudget").val("");
		$("#budgetCategories").val("--");
		$("#newBudgetRow").hide();
	});


	// navigation/tabs things
	$("nav ul").find("a").each(function(i, link) {
		$(link).on('click', function(event) {
		
			event.preventDefault();
			showTab($(link).attr('href'));
			history.pushState(null, $(link).attr('href'), $(link).attr('href'));
		});
	});

	$("#changeUser").on('click', function(event) {
		event.preventDefault();
		currentUser = prompt("username");
		localStorage.setItem("user", currentUser);

		getInfo();
	});

	//showTab('#transactions');
	if (window.location.hash !== "") {
		showTab(window.location.hash);
	} else {
		showTab('#transactions');
	}
});


var addItem = function(item) {
	var id = item.date + " " + item.name;
	id = id.replace(/\s+/g, '-');

	var row = $("<tr/>", {id: id});
	row.append($("<td/>").text( (new Date(item.date)).toISOString().substring(0, 10) ));
	row.append($("<td/>").text(item.iname));
	row.append($("<td/>").text("$" + item.amount));

	var tags = $("<td/>");
	$.each(item.categories, function(i, tag) {
		var link = $("<a/>", {class: "tag", href: "#filter"}).text(tag);
		tags.append(link);
		tags.append("&nbsp;");

		link.on('click', function(event) {
			event.preventDefault();
			filterTransactions(tag);
		});
	});

	row.append(tags);


	var killer = $("<a/>", {href: "#rm", item: id}).text("-");
	killer.click(function(event) {
		event.preventDefault();
		$.get("/data/remove", {id: item.id}, function(data) {
			if (data !== '"SUCCESS"') {
				alert("Couldn't remove. Everything's terrible...");
			} else {

				for (var i = 0; i < transactions.length; i++) {
					var curid = (transactions[i].date + " " + transactions[i].name).replace(/\s+/g, '-');
					if (curid === id) {
						$("#" + id).remove();
						balance += transactions[i].amount;

						transactions.splice(i, 1);

						break;
					}
				}
			}
		});

	});

	row.append($("<td/>").append(killer));

	row.appendTo($("#purchases tbody"));
};

var fillTable = function() {
	$("#purchases tbody").html("");

	$.each(transactions, function(i, item) {
		addItem(item);
	});
};

var getInfo = function() {
	transactions = [];
	categories = [];
	budgets = [];
	balance = 0;

	$.getJSON('/data/get', { uname: currentUser }, function(data) {
		transactions = data;

		$.each(transactions, function(i, item) {
			balance -= item.amount;

			$.each(item.categories, function(j, cat) {
				if ($.inArray(cat, categories) === -1) {
					categories.push(cat);
				}
			});
		});

		categories.sort();
		fillCategories();

		fillTable();

		$("#currentBalance").text("$" + balance);
	});

	$.getJSON('/budget/get', { uname: currentUser, all: "true" }, function(data) {
		budgets = data;

		fillBudgetTable();
	});
};

var fillCategories = function() {
	$("#budgetCategories").html("");

	categories.sort();

	$("<option/>", {value: "--"}).text("--").appendTo($("#budgetCategories"));

	$.each(categories, function(i, cat) {
		$("<option/>", {value: cat}).text(cat).appendTo($("#budgetCategories"));
	});
};

var fillBudgetTable = function() {
	$("#budgetTable tbody").html("");

	$.each(budgets, function(i, budget) {
		var row = $("<tr/>");
		row.append($("<td/>").text(budget.cname));
		row.append($("<td/>").text("$" + budget.amount));

		var used = 0;
		$.each(transactions, function(j, item) {
			if ($.inArray(budget.cname, item.categories) !== -1) {
				used += item.amount;
			}
		});

		row.append($("<td/>").text(used));
		row.append($("<td/>").text(budget.amount - used));

		var link = $("<a/>", {href: "#"}).text("-");
		link.on('click', function(event) {
			event.preventDefault();

			$.get('/budget/remove', {uname: currentUser, cname: budget.cname}, function(data) {
				if (data !== '"SUCCESS"') {
					alert("bad things happend. everything is horrible.");
				} else {
					for (var i = 0; i < budgets.length; i++) {
						if (budgets[i].cname === budget.cname) {
							budgets.splice(i, 1);
							break;
						}
					}

					fillBudgetTable();
				}
			});
		});

		row.append($("<td/>").append(link));

		row.appendTo("#budgetTable tbody");
	});
};


var filterTransactions = function(tag) {
	$("#purchases tbody").html("");
	$.each(transactions, function(i, item) {
		if ($.inArray(tag, item.categories) !== -1) {
			addItem(item);
		}
	});
};


var showTab = function(section) {
	fillTable();

	$("#tabs").find('section').each(function(i, tab) { $(tab).hide(); });
	$(section).show();
};

var getBal = function(un, s, e) {
	bal = 0;

	atStart = false;
	atEnd = false;

	for(i = 0; i < transactions.length && !atEnd; i++) {
		if(transactions[i].date.getTime() === s) {
			atStart = true;
		}

		if(transactions[i].date.getTime() === e) {
			atEnd = true;
		}

		if(atStart && !atEnd) {
			bal -= transactions[i].amount;
		}
	}
	
	return bal
};

var makeChart = function() {

};

var sumBox = function() {
	$(".sumBox").each(function(index) {
		m = startDate.getMonth() + index;
		year = startDate.getFullYear();
		if(m > 11) {
			m -= 12;
			year += 1;
		}
		$(this).append("<b>" + months[m] + ", " + year + "</b><br />");

		endm = m + 1;
		endy = year;
		if(endm > 11)
		{
			endm -= 12;
			endy += 1;
		}

		endDate = new Date(endy, endm, startDate.getDate());

		bal = getBal(currentUser, startDate, endDate);
		alert(bal);

		$(this).append("Income: " + 0 + "<br />");
		$(this).append("Expenses: " + 0 + "<br />");
		$(this).append("Monthly Net: " + bal + "<br />");
	});
};

window.onpopstate = function() {
	if (window.location.hash !== "") {
		showTab(window.location.hash);
	} else {
		showTab("#transactions");
	}
};