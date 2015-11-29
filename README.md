Schedule TV Shows
=================

This project is for follow your watched episodes on your favorites shows.

It's based on TVDB database : https://thetvdb.com.
If you wan to support the TVDB project : http://thetvdb.com/donate/.

It's an OpenSource project under MIT License.

Requirements
------------

- NodeJS > 4.0.0
- MySQL/MariaDB or Postgres

Installation
------------

Clone the source repository :

```
git clone https://github.com/leoncx/scheduletvshows.git
```

Install nodejs modules :

```
npm install
```

Install bower modules :

```
bower install
```

Create your database on your database server, configure the config.js file.

Run the initdb script

```
node bin/initdb migrate
```

Run your application with pm2 or another.