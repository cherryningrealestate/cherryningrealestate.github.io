app = {
	"itemCount": 0,
	"dataMap": []
}

function showAlert(level, text) {
	if (level == "error") level = "danger";

	if (text instanceof Error) {
		if (text.stack) text = text.stack;
		else if (text.message) text = text.message;
	}
	text = text.toString();

	$("#messages").append(`
		<div class="alert alert-%level% alert-dismissible fade show" role="alert">
			<span style="white-space: pre-wrap;">%text%</span>
			<button type="button" class="close" data-dismiss="alert">
 				<span>&times;</span>
			</button>
		</div>`
		.replace(/%level%/g, level)
	 	.replace(/%text%/g, text));
}

function loadMenuData() {
	$.ajaxSetup({ cache: false });
	$.getJSON("data.json").done(function(data) {
		app.menuData = data;
		try {
			renderMenu(data);
			let btn = $('#step0-btn > a');
			btn.click(step1);
			btn.removeClass('btn-disabled');
		} catch (e) {
			showAlert("error", ex);
		}
	}).fail(function(x, err, ex) {
		showAlert("error", ex);
	});
}

function renderNode(node, level, p) {
	app.itemCount += 1;
	let id = app.itemCount;

	let d = node.d;
	d.id = id;
	app.dataMap[id] = d;

	let e = $(`
		<div class="card level-%">
			<div class="card-header"></div>
			<div class="collapse" id="collapse#">
				<div class="card-body"></div>
			</div>
		</div>
		`.replace(/%/g, level).replace(/#/g, id)).appendTo(p);
	let header = e.find('.card-header');
	let body = e.find('.card-body');
	let col = e.find('.collapse');

	if (!d.checkbox) {
		col.collapse('show');
	} else {
		//header.click(function() {
		//	col.collapse('toggle');
		//});

		header.attr('style', 'border-bottom: none');

		let right = $('<div style="float: right">').appendTo(header);

		right.append('<span>$'+d.cost);

		if (!d.radio) {
			right.append(`
				<div class="custom-control custom-checkbox">
				  <input type="checkbox" class="custom-control-input" id="customCheck#">
				  <label class="custom-control-label" for="customCheck#"></label>
				</div>
				`.replace(/#/g, id));
		} else {
			right.append(`
				<div class="custom-control custom-checkbox">
				  <input type="radio" class="custom-control-input" name="%" id="customCheck#">
				  <label class="custom-control-label" for="customCheck#"></label>
				</div>
				`.replace(/#/g, id).replace(/%/g, d.group));
		}

		if (d.selected) {
			right.find('input').prop("checked", true);
		}
		if (d.disabled) {
			right.find('input').prop("disabled", true);
		}
	}

	header.append('<span>'+d.text+'</span>');

	if (node.children) {
		/*let eb = $('<div class="card-body">')
			.appendTo($('<div class="collapse show" id="collapseExample">')
				.appendTo(e))*/

		for (let c of node.children) {
			renderNode(c, level+1, body);
		}
	}
}

function renderMenu(data) {
	for (let c of data) {
		renderNode(c, 1, $('#menu-container'));
	}
}

function getSelected() {
	let a = [];
	for (let i = 1; i <= app.itemCount; i++) {
		if ($('#customCheck'+i).prop("checked")) {
			a.push(i);
		}
	}
	return a;
}

function renderStep2() {
	let t = $('#step2-tbody');
	t.empty();

	let selected = getSelected();
	for (let i of selected) {
		let d = app.dataMap[i];
		let row = $('<tr data-id="#">'.replace(/#/g, i)).appendTo(t);
		row.append('<td>' + d.cat);
		row.append('<td>' + d.oname);
		row.append('<td>' + '$'+d.cost);
		row.append(`
			<td>
				<div class="custom-control custom-checkbox">
				  <input type="radio" class="custom-control-input" name="s2check#" id="s2checkA#">
				  <label class="custom-control-label" for="s2checkA#"></label>
				</div>
			</td>
			<td>
				<div class="custom-control custom-checkbox">
				  <input type="radio" class="custom-control-input" name="s2check#" id="s2checkB#">
				  <label class="custom-control-label" for="s2checkB#"></label>
				</div>
			</td>
			`.replace(/#/g, i));
	}
}

function formatMoney(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function renderPrint() {
	let t2 = $('#step2-tbody');
	let tp = $('#print-tbody');
	tp.empty();

	let tot_1 = 0;
	let tot_2 = 0;

	t2.children().each(function(unused, e) {
		let i = parseInt($(e).attr('data-id'));
		let d = app.dataMap[i];
		let row = $('<tr>').appendTo(tp);
		row.append('<td>' + d.cat);
		row.append('<td>' + d.oname);
		if ($('#s2checkA'+i).prop("checked")) {
			row.append('<td>$'+d.cost);
			row.append('<td>$0');
			tot_1 += parseInt(d.cost);
		} else if ($('#s2checkB'+i).prop("checked")) {
			row.append('<td>$0');
			row.append('<td>$'+d.cost);
			tot_2 += parseInt(d.cost);
		} else {
			showAlert("warning", "Please complete selection");
			throw "";
		}
	});

	let gst = 0.15;
	$('#footer-11').text(formatMoney(tot_1));
	$('#footer-12').text(formatMoney(tot_2));
	$('#footer-21').text(formatMoney(tot_1 * gst));
	$('#footer-22').text(formatMoney(tot_2 * gst));
}

function step1() {
	$('#step0').addClass('hide');
	$('#step2').addClass('hide');
	$('#step1').removeClass('hide');
}

function step2() {
	try {
		renderStep2();
		$('#step1').addClass('hide');
		$('#step2').removeClass('hide');
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function step3() {
	try {
		renderPrint();
		setTimeout(print, 0);
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function overlayClose() {
	$('#overlay-container').addClass('hide');
	$('#overlay-image').addClass('hide');
}

function overlayImage(s) {
	$('#overlay-container').removeClass('hide');
	$('#overlay-image').removeClass('hide')
			.children('img').attr('src', s);
}

loadMenuData();
