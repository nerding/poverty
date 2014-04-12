var currentUser;
var transactions = [];
var categories = [];
var budgets = [];

$(document).ready(function() {
	// TODO: make a better login thing...
	currentUser = prompt("username");

	// get transactions
	getInfo();

	// setup the add new item stuff
	$("#addItem").click(function(event) {
		event.preventDefault();

		$("#newItemRow").toggle();
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

		$.get("/data/add", nItem, function(data) {});
		transactions.push(nItem);

		var cats = nItem.categories.split(',');
		$.each(cats, function(i, cat) {
			cat = cat.trim();

			if ($.inArray(cat, categories) === -1) {
				categories.push(cat);
			}
		});

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
			if (data !== "probably added.") {
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

	showTab('#transactions');
	if (window.location.hash) {
		showTab(window.location.hash);
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
		tags.append($("<span/>", {class: "tag"}).text(tag));
		tags.append("&nbsp;");
	});

	row.append(tags);


	var killer = $("<a/>", {href: "#rm", item: id}).text("-");
	killer.click(function(event) {
		event.preventDefault();
		$.get("/data/remove", {id: item.id}, function(data) {
			if (data !== "probably removed.") {
				alert("Couldn't remove. Everything's terrible...");
			} else {
				$("#" + id).remove();
			}
		})

	})

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
	$.getJSON('/data/get', { uname: currentUser }, function(data) {
		transactions = data;

		$.each(transactions, function(i, item) {
			$.each(item.categories, function(j, cat) {
				if ($.inArray(cat, categories) === -1) {
					categories.push(cat);
				}
			});
		});

		categories.sort();
		fillCategories();

		fillTable();
	});

	$.getJSON('/budget/get', { uname: currentUser, all: "true" }, function(data) {
		budgets = data;

		fillBudgetTable();
	});
}

var fillCategories = function() {
	$("#budgetCategories").html("");

	categories.sort();

	$("<option/>", {value: "--"}).text("--").appendTo($("#budgetCategories"));

	$.each(categories, function(i, cat) {
		$("<option/>", {value: cat}).text(cat).appendTo($("#budgetCategories"));
	});
}

var fillBudgetTable = function() {
	$("#budgetTable tbody").html("");

	$.each(budgets, function(i, budget) {
		var row = $("<tr/>");
		row.append($("<td/>").text(budget.cname));
		row.append($("<td/>").text("$" + budget.amount));
		row.appendTo("#budgetTable tbody");
	});
}


var showTab = function(section) {
	$("#tabs").find('section').each(function(i, tab) { $(tab).hide(); });
	$(section).show();
}

window.onpopstate = function() {
	if (window.location.hash) {
		showTab(window.location.hash);
	} else {
		showTab("#home");
	}
}