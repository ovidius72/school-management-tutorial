Realizza un backend in express/typescipt per la gestione di un registro elettronico per una scuola

- tech stack
- express
- typescript
- sqlite
- jwt
- cors

Il server deve supportare:

1. login con token/cookie
2. logout
3. refresh token
4. ogni CRUD operation sulle tabelle.

in base al seguente schema SQL.
user
-

id PK int
username UNIQUE string
email UNIQUE string
first_name string
last_name string
dob datetime
state string
city string
address string
created_at datetime
updated_at datetime

user_role
-

id_role int FK >- role.id
id_user int FK >- user.id

role
---

id PK int
name UNIQUE string
description string

role_permission
-

id_role int FK >- role.id
id_permission int FK >- permission.id

permission
---

id PK int
name UNIQUE string
description string

class
-

id PK int
name UNIQUE string
school_year_id int FK >- school_year.id
UNIQUE(name, school_year_id)

subject
-

id PK int
name UNIQUE string
description string

teacher_assignement
-

id int PK
teacher_id int FK >- user.id
class_id int FK >- class.id
subject_id int FK >- subject.id

class_enrollment
-

id PK int
class_id int FK >- class.id
student_id int FK >- user.id

grade
-

id int PK
student_id int FK >- user.id
teacher_id int FK >- user.id
subject_id int FK >- subject.id
value  decimal
description string
created_at datetime
updated_at datetime

school_year
-

id int PK
name UNIQUE string
start_date date
end_date date
is_active boolean
