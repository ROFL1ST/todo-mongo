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
```
4. run "npm start"

**BASE URL** = http://localhost:8000

## Login

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

## Register
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
| username  | Required | String  |
| password     | Required | String   |
| name       | Required | String   |




