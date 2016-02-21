"use strict";

// Static constants. Used values from a tutorial on quad-trees
var maxDepth = 5;
var maxItems = 10;

// Implementation of a quadtree for looking up items on the canvas
var QuadTree = function(bounds, parent, level) {
	if (isNaN(bounds.x) || isNaN(bounds.y) || isNaN(bounds.width) || isNaN(bounds.height)) {
		throw new Error("Must specify bounds when constructing quad tree");
	}

	this.parent = parent || null;
	this.level = level || 0; // start at first level if not defined
	this.bounds = bounds;
	this.nodes = []; // Child quad trees
	this.objects = [];
};

QuadTree.prototype.clear = function() {
	this.objects = [];

	this.nodes.forEach(function(node) {
		node.clear();
	});
	this.nodes = [];
};

/// Determine if this node is empty
QuadTree.prototype.isEmpty = function() {
	// We are only empty if all our nodes below us are empty
	var empty = this.nodes.reduce(function(p, c) {
		return p && c.isEmpty();
	}, true);

	if (empty) {
		empty = empty && this.objects.length === 0;
	}

	return empty;
};

QuadTree.prototype.insert = function(obj) {
	var node;

	if (this.nodes.length) {
		node = this.getNode(obj);

		if (node) {
			// Fits completely into child node? insert and end
			node.insert(obj);
			return;
		}
	}

	this.objects.push(obj);

	if (this.objects.length > maxItems && this.level < maxDepth) {
		if (this.nodes.length === 0) {
			this.split();
		}

		this.pushDown();
	}
};

QuadTree.prototype.pushDown = function() {
	var i = 0;
	while (i < this.objects.length) {
		var node = this.getNode(this.objects[i]);

		if (node !== null) {
			// remove and insert below
			node.insert(this.objects.splice(i, 1)[0]);
		} else {
			++i;
		}
	}
};

// Split a tree node into 4 sub nodes
QuadTree.prototype.split = function() {
	var subWidth = this.bounds.width / 2;
	var subHeight = this.bounds.height / 2;
	var x = this.bounds.x;
	var y = this.bounds.y;

	// Create 4 sub nodes
	this.nodes[0] = new QuadTree({ x: x + subWidth, y: y, width: subWidth, height: subHeight }, this, this.level + 1);
	this.nodes[1] = new QuadTree({ x: x, y: y, width: subWidth, height: subHeight }, this, this.level + 1);
	this.nodes[2] = new QuadTree({ x: x, y: y + subHeight, width: subWidth, height: subHeight }, this, this.level + 1);
	this.nodes[3] = new QuadTree({ x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight }, this, this.level + 1);
};

// Helper to figure out which node the rect goes into
// returns the node. null if it is bigger than all
QuadTree.prototype.getNode = function(rect) {
	var node = null;
	var midX = this.bounds.x + (this.bounds.width / 2);
	var midY = this.bounds.y + (this.bounds.height/ 2);

	var topQuadrant = rect.y < midY && rect.y + rect.height < midY; // fits completely in top
	var bottomQuadrant = rect.y > midY; // fits completely in bottom

	if (rect.x < midX && rect.x + rect.width < midX) {
		// Completely in the left quadrants
		node = topQuadrant? this.nodes[1] : bottomQuadrant ? this.nodes[2] : null;
	} else if (rect.x > midX) {
		// Completely within right quadrants
		node = topQuadrant ? this.nodes[0] : bottomQuadrant ? this.nodes[3] : null;
	}

	return node;
};

QuadTree.prototype.remove = function(obj) {
	var node = this.getNode(obj);

	if (node) {
		node.remove(obj);
	}

	var idx = this.objects.indexOf(obj);
	if (idx !== -1) {
		// Remove from ourself
		this.objects.splice(idx, 1);
	}
};

QuadTree.prototype.resize = function(newBounds) {
	this.bounds = newBounds;

	var subWidth = this.bounds.width / 2;
	var subHeight = this.bounds.height / 2;
	var x = this.bounds.x;
	var y = this.bounds.y;

	if (this.nodes.length) {
		this.split();
	}
};

// Retrieves all items that could collide with the rect
// Returns array of items. Empty array if none found
QuadTree.prototype.retrieve = function(rect) {
	var node = this.getNode(rect);
	var matches = [];

	if (node) {
		matches = node.retrieve(rect);
	}

	matches = matches.concat(this.objects);

	return matches;
};

module.exports = QuadTree;