var currentUser;

$(document).ready(function() {
	// TODO: make a better login thing...
	currentUser = prompt("username");

	// grab all data for currentUser and put on screen
	fillTable();

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

		$.get("/data/add", nItem, function(data) {
			//setTable(data);
			fillTable();
		})


		$("#newItemDate").val("");
		$("#newItemName").val("");
		$("#newItemPrice").val("");
		$("#newItemTags").val("");

		$("#newItemRow").hide();
	});
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
		$("#" + id).remove();
	})

	row.append($("<td/>").append(killer));

	row.appendTo($("#purchases tbody"));
};

var fillTable = function() {
	$("#purchases tbody").html("");

	$.getJSON('/data/get', { uname: currentUser }, function(data) {
		$.each(data, function(i, item) {
			addItem(item);
		});
	});
};