import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "Peter:2005!,",
  database: "autosalon_db",
});

export default pool;