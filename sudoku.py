from pdb import set_trace as debug

def f(n, obj=None):
  # This returns a dictionary with keys 0..n-1 with values obj..obj
  if not obj: return {k: None for k in xrange(n)}
  else: return {k: obj(9) for k in xrange(n)}

class Constraint:
  def __init__(self, buckets):
    self.buckets = f(buckets)

  def __getitem__(self, i):
    return self.buckets[i]

  def __setitem__(self, i, value):
    self.buckets[i] = value
    return

  def __iter__(self):
    return self.buckets.iteritems()

  def satisfied(self):
    s = set()
    for k, v in self.buckets.iteritems():
      if v in s and v is not None:
        return False
      s.add(v)
    return True

  def get_domain(self):
    # Returns domain of constraint
    s = set(range(1,10))
    for k, v in self.buckets.iteritems():
      s.discard(v)
    return s

class Board:
  def __init__(self, string=None):
    c = {}
    c['rows'] = f(9, Constraint)
    c['columns'] = f(9, Constraint)
    c['squares'] = f(9, Constraint)
    self.constraints = c
    self.guesses = 0
    # Initialise starting sudoku pieces
    if string:
      rows = [s.strip() for s in string.split("\n")]
      for i in xrange(9):
        for j in xrange(9):
          n = int(rows[i][j])
          if n:
            self.write(i,j,n)

  def __repr__(self):
    r = self.constraints['rows']
    for i in xrange(9):
      for j in xrange(9):
        if r[i][j] is None: print "_",
        else: print r[i][j],
      print
    return "  Sudoku Board  \n"

  def write(self, x, y, number, erase=False):
    # If erase is TRUE, erases number from row x, column y
    # and returns TRUE
    # If erase is FALSE, writes number to row x, column y
    # Returns TRUE if all constraints are satisfied
    # Otherwise returns FALSE
    if erase: number = None
    c = self.constraints
    c['rows'][x][y] = number
    c['columns'][y][x] = number
    a = (x/3)*3 + (y/3)
    b = (x%3)*3 + (y%3)
    c['squares'][a][b] = number
    if c['rows'][x].satisfied() and c['columns'][y].satisfied() and c['squares'][a].satisfied():
      return True
    else:
      #print "Constraint violated! ({0}, {1})".format(x,y)
      return False

  def next_empty(self):
    # Returns next empty space on board
    for i in xrange(9):
      for j in xrange(9):
        if self.constraints['rows'][i][j] is None:
          return (i,j)
    return None

  def smart_next_empty(self):
    # Attempts constraint propagation
    for i in xrange(9):
      for j in xrange(9):
        # Checks if square is empty
        if self.constraints['rows'][i][j] is not None: continue

        # Checks if domain is singleton
        s1 = self.constraints['rows'][i].get_domain()
        s2 = self.constraints['columns'][j].get_domain()
        s3 = self.constraints['squares'][(i/3)*3 + (j/3)].get_domain()
        s = s1 & s2 & s3
        if len(s) == 1:
          # Returns singleton location and assignment
          return (i,j,s.pop())
    return False

  def start_guess(self):
    # Gets first move and initialises DFS
    # Keeps track of number of guesses
    self.guesses = 0
    (x,y) = self.next_empty()
    return self.guess(x,y)

  def guess(self,x,y,num=None):
    # DFS to get next move
    for n in range(1,10):
      # Forces n = num if program already knows num can be assigned
      if num and n is not num: continue

      # For stack tracing purposes
      self.guesses += 1

      # Try another n if writing (x,y,n) violates constraints
      if not self.write(x,y,n): continue

      # If game is finished, return True
      t = self.next_empty()
      if t is None: return True

      # Guess next move, by trying singleton locations first
      (x2,y2) = t
      N = None
      t = self.smart_next_empty()
      if t: (x2,y2,N) = t

      # If game is finished, return up the stack
      if self.guess(x2,y2,N) is True:
        return True

      # Else backtrack and undo progress
      else:
        self.write(x2,y2,n,erase=True)

    # Oops, no number can be assigned, so backtrack
    return False

if __name__ == "__main__":
  b = Board("""530070000
               600195000
               098000060
               800060003
               400803001
               700020006
               060000280
               000419005
               000080079""")
  '''
  b = Board("""000000000
               000000000
               000000000
               000000100
               000000000
               002000000
               000000000
               000000000
               000003000""")
  '''
  print b
  if b.start_guess():
    print b
  else:
    print "No solution found"
  print "Iterations:", b.guesses
