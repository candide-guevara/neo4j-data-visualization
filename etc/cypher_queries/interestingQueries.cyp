# Get all destinations flown by AY and competitor DY
match (n:ond)--(m:ond)--(p:airline) 
  where p.myid='AY' 
with n,m 
  match (n)--(m)--(o:airline) 
    where o.myid='DY' 
return n.myid,m.myid;

# Compare my lower price for all dates with my competitor
match (n:ond)--(m:ond)--(p:airline)-[*]-(q:price) 
  where p.myid='AY' 
with n, m, min(q.myid) as pmin 
  match (n)--(m)--(o:airline)-[*]-(r:price) 
    where o.myid='DY' 
return n.myid,m.myid,pmin,min(r.myid);
