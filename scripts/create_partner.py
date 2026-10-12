import secrets
from app.core.security import hash_password
from app.db.connection import get_connection

def main():
    partner_name = "Demo Catalogue Partner"
    api_key = "partner_" + secrets.token_urlsafe(18)
    api_secret = secrets.token_urlsafe(32)
    secret_hash = hash_password(api_secret)

    sql = """
        INSERT INTO partner_clients (
            partner_name,
            api_key,
            secret_hash
        )
        VALUES (%s, %s, %s)
        RETURNING partner_id
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                sql,
                (partner_name, api_key, secret_hash),
            )
            partner = cursor.fetchone()

    print("Partner created successfully.")
    print(f"Partner ID: {partner['partner_id']}")
    print(f"API key: {api_key}")
    print(f"API secret: {api_secret}")
    print("Save these credentials securely; the secret is shown only once.")

if __name__ == "__main__":
    main()
