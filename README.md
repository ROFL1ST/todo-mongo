# todo-mongo-api

# Usage

1. Clone this repository

```markdown
https://github.com/ROFL1ST/todo-mongo-api.git
```
2. run "npm install"
3. Create .env file, then copy this code below

```dotenv
DB_HOST = [mongodb_host]  <--- insert your mongodb
JWT_ACCESS_TOKEN = [jwt_token]
JWT_INVITATION_TOKEN = [jwt_invitation_token]

DB_DATABASE = todo

process.env.PORT = 8000
CLOUD_NAME = [cloud_name]
API_KEY_CLOUD = [cloud_key]
API_SECRET_CLOUD = [secret_cloud]

MAIL_HOST = [host_mail]
MAIL_PORT = [port]
MAIL_USERNAME = [mail_username]
MAIL_PASSWORD = [mail_password]
MAIL_CLIENT_URL = [url]
EMAIL_MAIL= [your_email]
EMAIL_PASSWORD = [your_password]
```
4. run "npm start"

**LOCAL URL** = http://localhost:9000/api/

**ONLINE URL** = https://todo-mongo-api-production.up.railway.app/api/


## User

#### Login

```markdown
/login
```
**Method : POST**
Headers

|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body

|   Name   |  Status  |         |
| :------: | :------: | :-----: |
| username | Required | String  |
| password | Required | String  |

#### Register
```markdown
/register
```
**Method : POST**
Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Optional | String |

Body
|    Name     |  Status  |          |
| :-------: | :------: | :------: |
| email  | Required | String  |
| username  | Required | String  |
| password     | Required | String   |
| name       | Required | String   |

#### update profile
```markdown
/user
```
**Method : PUT**
Headers

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name     |  Status  |          |
| :-------: | :------: | :------: |
| username  | Optional | String  |
| name     | Optional | String   |
| photo_profile | Optional | File   |

#### Search user

```markdown
/user
```
**Method : GET**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Params
|    Name     |  Status  | 
| :-------: | :------: |
| username  | Optional |
| name     | Optional |


#### Detail User
```markdown
/user/[id]
```
**Method : GET**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### Profile

```markdown
/profile
```

**Method: GET**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

## Todo

### Get todo
```markdown
/todo
```

**Method: Get**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Params
|    Name     |  Status  | 
| :-------: | :------: |
| page  | Optional |
| limit | Optional     |
| key    | Optional |

### get detail

```markdown
/todo/[id]
```

**Method: Get**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### Post Todo
```markdown
/todo
```

**Method: Post**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name     |  Status  |          |
| :-------: | :------: | :------: |
| name     | Required | String   |
| description | Required | String   |

### Update Todo
```markdown
/todo/[id]
```

**Method: Put**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name     |  Status  |          |
| :-------: | :------: | :------: |
| name     | Optional | String   |
| description | Optional | String   |
| percent | Optional | String   |

### Delete Todo
```markdown
/todo/[id]
```

**Method: Delete**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### Invite user
```markdown
/todo/add/[id]
```

**Method: Post**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name     |  Status  |          |
| :-------: | :------: | :------: |
| invitedUser | Required | String   |

### get invitation
```markdown
/todo/invitation
```

**Method: Get**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### invitation respond
```markdown
/todo/invitation
```

**Method: Put**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name     |  Status  |          |
| :-------: | :------: | :------: |
| status   | Required | ["accepted", "rejected"] |

### kick user (Only For Owner)

```markdown
/todo/kick/[id]
```

**Method: Delete**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### update role (Only For Owner)

```markdown
/todo/role/[id]
```

**Method: Put**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name   |  Status  |          |
| :-------: | :------: | :------: |
| role      | Required | String   |


## Todo List

### Get List

```markdown
/todo/list/[id]
```

**Method: Get**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### Detail List

```markdown
/todo/detail-list/[id]
```

**Method: Get**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

### Post List

```markdown
/todo/createList
```

**Method: Post**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name   |  Status  |          |
| :-------: | :------: | :------: |
| id_todo      | Required | String   |
| name      | Required | String   |
| start      | Required | Date   |
| end      | Required | Date   |

### Update List

```markdown
/todo/list/[id]
```

**Method: Put**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |

Body
|    Name   |  Status  |          |
| :-------: | :------: | :------: |
| name      | Optional | String   |
| start      | Optional | Date   |
| end      | Optional | Date   |
| priority      | Optional | ["low", "normal", "high", "urgent"]   |
| status      | Optional | ["open", "pending", "in progress", "completed"]   |

### Delete List

```markdown
/todo/remove-list/[id]
```

**Method: Delete**

Headers
|     Name      |  Status  |        |
| :-----------: | :------: | :----: |
| Authorization | Required | String |












