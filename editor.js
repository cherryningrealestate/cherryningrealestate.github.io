var editor = {};
editor.nextId = 1;
editor.dataMap = [];
editor.elemMap = [];

function editorAddCaret(hide, p) {
	let c = $('<span class="caret">&#x25B7</span>').appendTo(p);
	let f = function() {
		p.children('ul').toggleClass('hide');
		c.toggleClass('caret-down');
	};
	c.click(f);
	if (hide) {
		window.setTimeout(f, 0)
	}
	
	return c;
}

function editorInsertNode(d, hide, p) {
	let li = $('<li class="item">').insertBefore(p);
	editorAddCaret(hide, li);
	let t = $('<span class="item-text">'+d.text+'</span>').appendTo(li);
	let ul = $('<ul>').appendTo(li)

	let id = editor.nextId;
	editor.nextId++;
	editor.dataMap[id] = d;
	editor.elemMap[id] = li;

	li.attr('data-id', id);
	t.click(function(ev) {
		let x = ev.target.parentElement.getAttribute("data-id");
		if (!x) return;
		editorSelectEdit(parseInt(x));
	});

	return ul;
}

function editorLoadNodes(nodes, p) {
	let li = $('<li class="item item-new">').appendTo(p);
	let c = editorAddCaret(false, li);
	c.attr('style', 'visibility: hidden;');
	let e = li.append('<span class="item-new-text">+</span>');
	e.click(function() {
		let ul = editorInsertNode({
			"text": "New Item",
			"checkbox": true
		}, true, li);
		editorLoadNodes([], ul);
		editorSelectEdit(editor.nextId - 1);
	});

	if (nodes) {
		for (let node of nodes) {
			let ul = editorInsertNode(node.d, !node.children.length, li);
			editorLoadNodes(node.children, ul);
		}
	}
}

function editorGenerateJson(p) {
	let arr = [];
	p.children('li').each(function(i, elem) {
		let e = $(elem);
		if (e.hasClass('item-new')) return;

		let id = parseInt(e.attr('data-id'));
		arr[i] = {
			"d": editor.dataMap[id],
			"children": editorGenerateJson(e.children('ul'))
		};
	});
	return arr;
}

function editorDelete() {
	let edit = $('#edit-container');
	let id = parseInt(edit.attr('data-id'));
	editor.elemMap[id].remove();
	edit.attr('data-id', '-1');
}

function editorMoveUp() {
	let edit = $('#edit-container');
	let id = parseInt(edit.attr('data-id'));
	let e = editor.elemMap[id];
	if (e.prev().length > 0) {
		e.prev().insertAfter(e);
	}
}

function editorMoveDown() {
	let edit = $('#edit-container');
	let id = parseInt(edit.attr('data-id'));
	let e = editor.elemMap[id];
	if (e.next().next().length > 0) {
		e.next().insertBefore(e);
	}
}

function editorSelectEdit(id) {
	let e = $('#edit-container');
	let d = editor.dataMap[id];
	
	e.attr('data-id', id);

	if (!d.checkbox) {
		$('#type-cat').prop("checked", true);
		$('#group-container').addClass('hide');
	} else if (!d.radio) {
		$('#type-item').prop("checked", true);
		$('#group-container').addClass('hide');
	} else {
		$('#type-radio').prop("checked", true);
		$('#group-container').removeClass('hide');
		$('#group-input').val(d.group);
	}

	$('#name-input').val(d.text);
	$('#oname-input').val(d.oname);
	$('#cat-input').val(d.cat);
	$('#cost-input').val(d.cost);

	if (d.contrib) $('#check-contrib').prop('checked', true);
	else $('#check-contrib').prop('checked', false);
	if (d.selected) $('#check-sel').prop('checked', true);
	else $('#check-sel').prop('checked', false);
	if (d.disabled) $('#check-dis').prop('checked', true);
	else $('#check-dis').prop('checked', false);

	if (d.link) {
		$('#check-link').prop('checked', true);
		$('#link-input').val(d.link);
		$('#link-input').removeClass('hide');
	} else {
		$('#check-link').prop('checked', false);
		$('#link-input').val("");
		$('#link-input').addClass('hide');
	}
	if (d.pdf) {
		$('#check-pdf').prop('checked', true);
		$('#pdf-input').val(d.pdf);
		$('#pdf-input').removeClass('hide');
	} else {
		$('#check-pdf').prop('checked', false);
		$('#pdf-input').val("");
		$('#pdf-input').addClass('hide');
	}
}

function editorEditEvent() {
	let e = $('#edit-container');
	let id = parseInt(e.attr('data-id'));
	if (id < 0) return;
	editor.dataMap[id] = {};
	let d = editor.dataMap[id];

	if ($('#type-cat').is(":checked")) {
		d.checkbox = false;
		$('#group-container').addClass('hide');
		delete d.group;
	} else if ($('#type-item').is(":checked")) {
		d.checkbox = true;
		d.radio = false;
		$('#group-container').addClass('hide');
		delete d.group;
	} else if ($('#type-radio').is(":checked")) {
		d.checkbox = true;
		d.radio = true;
		$('#group-container').removeClass('hide');
		d.group = $('#group-input').val();
	}

	let name = $('#name-input').val();
	editor.elemMap[id].children('.item-text').text(name);
	d.text = name;
	d.oname = $('#oname-input').val();
	d.cost = $('#cost-input').val();
	d.cat = $('#cat-input').val();
	d.contrib = $('#check-contrib').is(":checked");
	d.selected = $('#check-sel').is(":checked");
	d.disabled = $('#check-dis').is(":checked");

	if ($('#check-link').is(":checked")) {
		$('#link-input').removeClass('hide');
		d.link = $('#link-input').val();
	} else {
		$('#link-input').addClass('hide');
		delete d.link;
	}
	if ($('#check-pdf').is(":checked")) {
		$('#pdf-input').removeClass('hide');
		d.pdf = $('#pdf-input').val();
	} else {
		$('#pdf-input').addClass('hide');
		delete d.pdf;
	}
}

function editorSetHandlers() {
	let e = $('#edit-container');
	let f = editorEditEvent;

	$('#name-input').on("input", f);
	$('#oname-input').on("input", f);
	$('#cost-input').on("input", f);
	$('#cat-input').on("input", f);
	$('#group-input').on("input", f);

	$('#type-cat').on("click", f);
	$('#type-item').on("click", f);
	$('#type-radio').on("click", f);

	$('#check-contrib').on("click", f);
	$('#check-sel').on("click", f);
	$('#check-dis').on("click", f);

	$('#check-link').on("click", f);
	$('#check-pdf').on("click", f);
	$('#link-input').on("input", f);
	$('#pdf-input').on("input", f);
}

function editorSave() {
	let o = editorGenerateJson($('#tree-root'));
	let s = JSON.stringify(o, null, 1);
	let b = new Blob([s], {type: "application/json"});
	let u = URL.createObjectURL(b);
	let a = document.createElement('a');
	a.href = URL.createObjectURL(b);
	a.download = "data.json";
	a.click();
}

function editorLoad() {
	let input = document.createElement('input');
	input.type = 'file';
	input.onchange = function(e) {
		let file = e.target.files[0];
		let reader = new FileReader();
		reader.readAsText(file, 'UTF-8');
		reader.onload = function(ev) {
			let content = JSON.parse(ev.target.result);
			editorLoadNodes(content, $('#tree-root'));
		}
	}
	input.click();
}

editorSetHandlers();
