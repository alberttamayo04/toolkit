'use strict';

// modules
// ----
const express = require('express');
const path = require('path');
const axios = require('axios');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const fs = require('chai-fs');
chai.use(fs);


// create express app
// ----
const app = express(),
      port = 3000,
      server = 'localhost',
      dist = path.join(__dirname, '..', 'dist'),
      index = path.join(__dirname, '..', 'dist/index.html');
      
app.use(express.static(dist));

// deploy ./dist/index.html to express app
app.get('/', (req, res) => {
	res.sendFile(index);
});

app.listen(3000);


// test scripts
// ----

// check if node application serve is running
describe('node application server', () => {
	it("should return 200 statusCode response", (done) => {
		axios.get(`http://${server}:${port}`)
		.then((response) => {
			expect(response.status).to.equal(200);
		})
		.catch((error) => {
			console.log(error);
		});
		done();
	});
});

// check /dist folder
describe('/dist folder', () => {
	it('should be a directory', () => {
		assert.isDirectory(dist);
	});

	it('should not be empty', () => {
		assert.notIsEmptyDirectory(dist);
	});

	it('should contain the main stylesheet', () => {
		assert.directoryIncludeFiles(dist + '/assets/toolkit/styles', ['toolkit.css']);
	});

	it('should contain bootstrap vendor files', () => {
		expect(dist + '/vendor/bootstrap').with.deep.subDirs(['css', 'fonts', 'js']);
	});

	it('should contain minified jquery file', () => {
		assert.directoryIncludeFiles(dist + '/vendor/jquery', ['jquery.min.js']);
	});
});

// check /dist/index.html
describe('index.html', () => {
	it('should be a file', () => {
		assert.isFile(index);
	});

	it('should not be empty', () => {
		assert.notIsEmptyFile(index);
	});

	it('should have a reference to the main stylesheet', () => {
		expect(index).with.contents.that.match(/toolkit.css/);
	});

	it('should have a reference to bootstrap files', () => {
		expect(index).with.contents.that.match(/bootstrap.min.css/);
		expect(index).with.contents.that.match(/bootstrap.min.js/);
	});

	it('should have a reference to jquery', () => {
		expect(index).with.contents.that.match(/jquery.min.js/);
	});
});
