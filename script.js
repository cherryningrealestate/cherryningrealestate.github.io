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
			let btn = $('#step0-btn');
			btn.click(step1);
			btn.removeAttr('disabled');
		} catch (e) {
			showAlert("error", e);
		}
	}).fail(function(x, err, ex) {
		showAlert("error", err);
	});
}

function renderNode(node, level, p) {
	app.itemCount += 1;
	let id = app.itemCount;

	let d = node.d;
	d.id = id;
	app.dataMap[id] = d;
	if (!d.oname) d.oname = d.text;

	let e = $(`
		<div class="card level-%">
			<div class="card-header"></div>
			<div class="card-body"></div>
		</div>
		`.replace(/%/g, level).replace(/#/g, id)).appendTo(p);
	let header = e.find('.card-header');
	let body = e.find('.card-body');

	if (d.checkbox) {
		header.attr('style', 'border-bottom: none');

		let right = $('<div class="float-right">').appendTo(header);

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

	if (d.link) {
		header.append('<a target="_blank" rel="noopener noreferrer" href="'+d.link+'">'+d.text+'</a>');
	} else {
		header.append('<span>'+d.text+'</span>');
	}

	if (d.pdf) {
		let href = 'javascript:overlayPdf('+id+')'
		header.append('<a class="btn btn-primary btn-sm" href='+href+'>PDF</a>');
	}

	if (node.children) {
		for (let c of node.children) {
			renderNode(c, level+1, body);
		}
	}
}

function renderMenu(data) {
	for (let c of data) {
		renderNode(c, 1, $('#menu-container'));
	}

	// Allow deselecting radio buttons
	$('input[type="radio"]').click(function() {
		$('input[name="' + $(this).attr('name') + '"]').not($(this)).prop('pchecked', false);
	}); 
	$("input[type='radio']").click(function() {
		if ($(this).prop('pchecked')) {
			$(this).prop('checked', false);
			$(this).prop('pchecked', false);
		} else {
			$(this).prop('pchecked', true)
		}
	});
}

function isSelected(i) {
	return $('#customCheck'+i).prop("checked");
}

function getSelected() {
	let a = [];
	for (let i = 1; i <= app.itemCount; i++) {
		if (isSelected(i)) {
			a.push(i);
		}
	}
	return a;
}

function formatMoney(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function renderStep2() {
	let t = $('#step2-table > tbody');
	t.empty();

	let cnt = 0;
	let tot = 0;

	for (let i = 1; i <= app.itemCount; i++) {
		if (isSelected(i)) {
			let d = app.dataMap[i];
			let row = $('<tr data-id="#">'.replace(/#/g, i)).appendTo(t);
			row.append('<td>' + d.cat);
			row.append('<td>' + d.oname);
			row.append('<td>' + '$'+d.cost);
			tot += parseFloat(d.cost);
			cnt += 1;
		}
	}

	$('#step2-table > tfoot > tr > th:nth-child(3)').text(formatMoney(tot));

	return cnt;
}

function renderStep3() {
	let t = $('#step3-table > tbody');
	t.empty();

	t.append('<tr><td>Generic Sign</td><td>$0</td></tr>');

	let tot = 0;

	for (let i = 1; i <= app.itemCount; i++) {
		let d = app.dataMap[i];
		if (d.contrib && !isSelected(i)) {
			let d = app.dataMap[i];
			let row = $('<tr>').appendTo(t);
			row.append('<td>' + d.oname);
			row.append('<td>' + '$'+d.cost);
			tot += parseFloat(d.cost);
		}
	}

	$('#step3-table > tfoot > tr > th:nth-child(2)').text(formatMoney(tot));

	return tot;
}

function renderPrint() {
	$('#print-addr').text(app.address);

	let tp = $('#print-tbody');
	tp.empty();

	let tot_1 = 0;
	let tot_2 = 0;

	for (let i = 1; i <= app.itemCount; i++) {
		let d = app.dataMap[i];
		if (isSelected(i) || d.contrib) {
			let row = $('<tr>').appendTo(tp);
			row.append('<td>' + d.cat);
			row.append('<td>' + d.oname);

			if (isSelected(i)) {
				row.append('<td>$0');
				row.append('<td>$'+d.cost);
				tot_2 += parseFloat(d.cost);
			} else {
				row.append('<td>$'+d.cost);
				row.append('<td>$0');
				tot_1 += parseFloat(d.cost);
			}
		}
	}

	let gst = 0.15;
	$('#footer-11').text(formatMoney(tot_1));
	$('#footer-12').text(formatMoney(tot_2));
	$('#footer-21').text(formatMoney(tot_1 * gst));
	$('#footer-22').text(formatMoney(tot_2 * gst));
}

function step1() {
	try {
		window.scrollTo(0, 0);
		app.address = $('#step0-addr').val().trim();
		$('#step0').addClass('hide');
		$('#step2').addClass('hide');
		$('#step3').addClass('hide');
		$('#step1').removeClass('hide');
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function step2() {
	if (renderStep2() === 0) {
		step3();
		return;
	}
	try {
		window.scrollTo(0, 0);
		$('#step1').addClass('hide');
		$('#step2').removeClass('hide');
		$('#step3').addClass('hide');
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function step3() {
	if (renderStep3() === 0) {
		stepp();
		return;
	}
	try {
		window.scrollTo(0, 0);
		$('#step1').addClass('hide');
		$('#step2').addClass('hide');
		$('#step3').removeClass('hide');
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function stepp() {
	try {
		renderPrint();
		setTimeout(print, 0);
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function overlayClose() {
	$('.overlay').addClass('hide');
	$('.overlay > iframe').attr("src", "");
}

function overlayPdf(id) {
	try {
		let s = app.dataMap[id].pdf;
		let url = "/pdfjs/viewer.html?file="+encodeURI("/pdf/"+s);
		$('.overlay > iframe').attr("src", url);

		$('.overlay').removeClass('hide');
	} catch (e) {
		if (e) showAlert("error", e);
	}
}

function loadAutocomplete() {
	var placesAutocomplete = places({
    appId: 'plZ0UP6WURH8',
    apiKey: '6f080d1631083ff615b23460c64ccda8',
    container: document.querySelector('#step0-addr'),
    templates: {
      value: function(suggestion) {
      	let s = suggestion.name;
      	if (suggestion.suburb) s += ", " + suggestion.suburb;
      	return s;
      }
    }
  }).configure({
    type: 'address',
    countries: ['nz'],
    aroundLatLng: '-36.89,174.65'
  });
}

loadMenuData();
loadAutocomplete();
