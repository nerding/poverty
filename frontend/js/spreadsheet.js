$(document).ready(function() {
	// setup the add new item stuff
	$("#addItem").click(function(event) {
		event.preventDefault();

		$("#newItemRow").toggle();
	});

	$("#newItem").submit(function(event) {
		event.preventDefault();

		var nItem = {
			date: $("#newItemDate").val(),
			name: $("#newItemName").val(),
			price: $("#newItemPrice").val(),
			tags: $("#newItemTags").val()
		};

		$("#newItemDate").val("");
		$("#newItemName").val("");
		$("#newItemPrice").val("");
		$("#newItemTags").val("");

		addItem(nItem);
		$("#newItemRow").hide();
	});


	$('.rm-item').each(function(i, iter) {
		$(iter).click(function(event) {
			event.preventDefault();

			//alert("delete item: " + $(iter).attr('item'))
			$("#" + $(iter).attr('item')).remove();
		});
	});
});


var addItem = function(item) {
	var id = item.date + " " + item.name;
	id = id.replace(/\s+/g, '-');

	var row = $("<tr/>", {id: id});
	row.append($("<td/>").text(item.date));
	row.append($("<td/>").text(item.name));
	row.append($("<td/>").text("$" + item.price));

	// TODO: separate out tags into an array (take string, separate on commas).
	//		 with separated tags, add them to spans, see HTML page for details.
	row.append($("<td/>").text(item.tags));

	var killer = $("<a/>", {href: "#rm", item: id}).text("-");
	killer.click(function(event) {
		event.preventDefault();
		$("#" + id).remove();
	})

	row.append($("<td/>").append(killer));

	row.appendTo($("#purchases"));
}