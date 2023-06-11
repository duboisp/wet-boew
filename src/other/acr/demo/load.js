( function( window, document ) {
"use strict";

const myButton = document.querySelector('#mybutton');

myButton.addEventListener('click', actionBtn );

function actionBtn() {

	let fileInput;

	// Check if the input is already attached, if so reuse
	if ( this.wbBind ) {
		fileInput = this.wbBind;
	} else {

		// Create the file input
		fileInput = document.createElement('input');
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("hidden", "");
		fileInput.accept = ".json,.json-ld,application/json";

		// Attach the file upload input
		this.parentElement.insertBefore( fileInput, this );
		fileInput.addEventListener('change', getUploadedFile);
		this.wbBind = fileInput;
	}

	// Trigger the upload
	fileInput.click();

}


// const myInput = document.querySelector('#yep');
// myInput.addEventListener('change', getUploadedFile);

function getUploadedFile() {

	const curFiles = this.files;

	if (curFiles.length === 0) {
		console.log( "No file selected" );
		return;
	}

	for (const file of curFiles) {

		if ( !validFileType(file) ) {
			console.error( "File format not accepted" );
			continue;
		}

		file.text().then( function( text) {
			console.log( text );
		} );

		var url = URL.createObjectURL( file );

		$( "#ds-a11y" ).attr( "data-wb-jsonmanager-reload", "" );

		// Trigger a JSON load on the source
		$( "#ds-a11y" ).trigger( {
			type: "json-fetch.wb",
			fetch: {
				url: url,
				alias: "assessment"
			}
		} );

		console.log( url );
	}
}

const fileTypes = [
	"application/json"
];

function validFileType(file) {
	return fileTypes.includes(file.type);
}



} )( window, document );
