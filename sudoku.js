var dim = 9;

function f(n, obj) {
  // This returns a dictionary with keys 0..n-1 with values obj..obj
  var dict = {};
  for (var i = 0; i<n; i++) {
    dict[i] = ((obj == null) ? null : new obj(dim));
  }
  return dict;
}

var Constraint = (function() {
  // Initialize Constraint object
  function Constraint(buckets) {
    this.buckets = f(buckets);
    return;
  }

  Constraint.prototype.satisfied = function() {
    var s = {}
    for (var key in this.buckets) {
      if (this.buckets[key] in s && this.buckets[key] != null) return false;
      s[this.buckets[key]] = null;
    }
    return true;
  }

  Constraint.prototype.get_domain = function() {
    // Extremely long winded way to get domain of constaint
    var s = {}
    for (var key in this.buckets) {
      if (this.buckets[key] != null) s[this.buckets[key]] = null;
    }
    var a = []
    for (var i=1; i<dim+1; i++) {
      if (!(i in s)) a.push(i);
    }
    return a;
  }

  return Constraint;
})();

var Board = (function() {
  // Initialize Board object
  function Board(string) {
    this.constraints = {};
    this.constraints['rows'] = f(9, Constraint);
    this.constraints['columns'] = f(9, Constraint);
    this.constraints['squares'] = f(9, Constraint);
    this.guesses = 0;
    this.contradiction = false;

    // Initialize starting sudoku pieces
    var rows = string.split("\n");
    rows.map(function(str){return str.trim();});
    for (var i=0; i<dim; i++) {
      for (var j=0; j<dim; j++) {
        var n = rows[i][j]
        if (n>0) {
          if (!this.write(i,j,n)) this.contradiction = true;
        }
      }
    }
    return;
  }

  Board.prototype.print = function() {
    for (var i=0; i<dim; i++) {
      var str = ""
      for (var j=0; j<dim; j++) {
        str += (this.constraints['rows'][i].buckets[j] ? this.constraints['rows'][i].buckets[j] : "_");
        str += " ";
      }
      console.log(str);
    }
    console.log("  Sudoku Board  \n");
  }

  // This function writes or erases a number to the board
  Board.prototype.write = function(x,y,number,erase) {
    // If erase is TRUE, erases number from row x, column y
    // and returns TRUE
    // If erase is FALSE,  writes number of row x, column y
    // Returns TRUE if all constraints are satisfied
    // Otherwise returns FALSE
    if (erase) number = null;
    var c = this.constraints;
    c['rows'][x].buckets[y] = number;
    c['columns'][y].buckets[x] = number;
    var a = ~~(x/3)*3 + ~~(y/3);
    var b = (x%3)*3 + (y%3);
    c['squares'][a].buckets[b] = number;
    if (c['rows'][x].satisfied() && c['columns'][y].satisfied() && c['squares'][a].satisfied()) return true;
    else return false;
  }

  Board.prototype.next_empty = function() {
    // Returns next empty space on board
    for (var i=0; i<dim; i++) {
      for (var j=0; j<dim; j++) {
        if (this.constraints['rows'][i].buckets[j] == null) {
          return [i,j];
        }
      }
    }
    return null;
  }

  Board.prototype.smart_next_empty = function() {
    for (var i=0; i<dim; i++) {
      for (var j=0; j<dim; j++) {
        // Ensures square is empty
        if (this.constraints['rows'][i].buckets[j] != null) continue;

        // Checks if domain is singleton
        var s1 = this.constraints['rows'][i].get_domain();
        var s2 = this.constraints['columns'][j].get_domain();
        var s3 = this.constraints['squares'][~~(i/3)*3 + ~~(j/3)].get_domain();

        // Finds set intersection of s1 & s2 & s3
        s = s1.filter(function(n) {
          return s2.indexOf(n) != -1 && s3.indexOf(n) != -1;
        });

        // Returns singleton location and assignment
        if (s.length == 1) return [i,j,s[0]];
      }
    }
    return false;
  }

  Board.prototype.start_guess = function() {
    // Gets first move and initialises DFS
    this.guesses = 0;
    var tup = this.next_empty();
    return this.guess(tup[0],tup[1],null);
  }

  Board.prototype.guess = function(x,y,num) {
    //console.log("guess on",x,y,num);
    // DFS to get next move
    for (var n=1; n<dim+1; n++) {
      // Forces n = num if program already knows num can be assigned
      if (num != null && num != n) continue;

      // For stack tracing purposes
      this.guesses++;

      // Try another n if writing (x,y,n) violates constraints
      if (!this.write(x,y,n,false)) continue;

      // If game is finished, return TRUE
      var t = this.next_empty();
      if (t == null) return true;

      // Guess next move by trying singleton locations first
      var z = [t[0],t[1],null];
      t = this.smart_next_empty();
      if (t) z = [t[0],t[1],t[2]];

      // If game is finished, return up the stack
      if (this.guess(z[0], z[1], z[2])) return true;

      // Else backtrack and undo progress
      else this.write(z[0],z[1],z[2],true);
    }

    // Oops, no number can be assigned, so backtrack
    return false;
  }

  return Board;
})();
