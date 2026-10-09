from fastapi import (
    FastAPI,
    Form,
    UploadFile,
    File,
    HTTPException,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from datetime import datetime, timedelta
from pathlib import Path

import shutil
import re
import pandas as pd

from passlib.context import CryptContext
from jose import jwt


# =========================================================
# DATABASE
# =========================================================

DATABASE_URL = "sqlite:///./bizora.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# =========================================================
# AUTH CONFIG
# =========================================================

SECRET_KEY = "bizora-ai-super-secret-key-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)


# =========================================================
# USER MODEL
# =========================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    shop_name = Column(
        String,
        nullable=False,
    )

    owner_name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    phone = Column(
        String,
        nullable=True,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# =========================================================
# LEAD MODEL
# =========================================================

class Lead(Base):

    __tablename__ = "leads"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # NEW
    user_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    business_name = Column(
        String,
        nullable=False,
    )

    business_type = Column(
        String,
        nullable=False,
    )

    owner_name = Column(
        String,
        nullable=False,
    )

    whatsapp = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        nullable=False,
    )

    file_name = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# =========================================================
# DATABASE MIGRATION
# =========================================================

def migrate_database():

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:

        # Check whether user_id already exists
        result = db.execute(
            text("PRAGMA table_info(leads)")
        )

        columns = [
            row[1]
            for row in result.fetchall()
        ]

        if "user_id" not in columns:

            db.execute(
                text(
                    "ALTER TABLE leads "
                    "ADD COLUMN user_id INTEGER"
                )
            )

            db.commit()

            print(
                "Database migration: "
                "user_id column added to leads."
            )

        else:

            print(
                "Database migration: "
                "user_id already exists."
            )

    except Exception as error:

        db.rollback()

        print(
            "Database migration error:",
            error,
        )

    finally:

        db.close()


migrate_database()


# =========================================================
# FILE STORAGE
# =========================================================

UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="Bizora AI API",
    version="4.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# AUTH HELPERS
# =========================================================

def hash_password(password: str):

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
):

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(user_id: int):

    expire = (
        datetime.utcnow()
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        return int(user_id)

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# =========================================================
# HOME
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Bizora AI API is running 🚀",
        "version": "4.0.0",
    }


# =========================================================
# REGISTER
# =========================================================

@app.post("/api/auth/register")
def register_user(

    shop_name: str = Form(...),

    owner_name: str = Form(...),

    email: str = Form(...),

    phone: str = Form(None),

    password: str = Form(...),

):

    db = SessionLocal()

    try:

        shop_name = shop_name.strip()
        owner_name = owner_name.strip()
        email = email.strip().lower()

        phone = (
            phone.strip()
            if phone
            else None
        )

        if len(password) < 6:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Password must be at least "
                    "6 characters."
                ),
            )

        existing_user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing_user:

            raise HTTPException(
                status_code=400,
                detail=(
                    "An account with this "
                    "email already exists."
                ),
            )

        new_user = User(

            shop_name=shop_name,

            owner_name=owner_name,

            email=email,

            phone=phone,

            password_hash=hash_password(
                password
            ),
        )

        db.add(new_user)

        db.commit()

        db.refresh(new_user)

        token = create_access_token(
            new_user.id
        )

        return {

            "success": True,

            "message": "Registration successful",

            "access_token": token,

            "token_type": "bearer",

            "user": {

                "id": new_user.id,

                "shop_name":
                    new_user.shop_name,

                "owner_name":
                    new_user.owner_name,

                "email":
                    new_user.email,

                "phone":
                    new_user.phone,

            },
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print(
            "Registration error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Could not create account",
        )

    finally:

        db.close()


# =========================================================
# LOGIN
# =========================================================

@app.post("/api/auth/login")
def login_user(

    email: str = Form(...),

    password: str = Form(...),

):

    db = SessionLocal()

    try:

        email = email.strip().lower()

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        if not verify_password(
            password,
            user.password_hash,
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        token = create_access_token(
            user.id
        )

        return {

            "success": True,

            "message": "Login successful",

            "access_token": token,

            "token_type": "bearer",

            "user": {

                "id": user.id,

                "shop_name":
                    user.shop_name,

                "owner_name":
                    user.owner_name,

                "email":
                    user.email,

                "phone":
                    user.phone,

            },
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "Login error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Login failed",
        )

    finally:

        db.close()


# =========================================================
# CURRENT USER
# =========================================================

@app.get("/api/auth/me")
def get_me(
    user_id: int = Depends(get_current_user),
):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        return {

            "success": True,

            "user": {

                "id": user.id,

                "shop_name":
                    user.shop_name,

                "owner_name":
                    user.owner_name,

                "email":
                    user.email,

                "phone":
                    user.phone,

                "created_at": (

                    user.created_at.isoformat()

                    if user.created_at

                    else None
                ),
            },
        }

    finally:

        db.close()


# =========================================================
# FREE ANALYSIS
# =========================================================
# This remains PUBLIC.
# It is used by the landing page lead form.
# =========================================================

@app.post("/api/free-analysis")
async def free_analysis(

    business_name: str = Form(...),

    business_type: str = Form(...),

    owner_name: str = Form(...),

    whatsapp: str = Form(...),

    email: str = Form(...),

    current_user: User = Depends(get_current_user),

    sales_file: UploadFile | None = File(None),

):

    db = SessionLocal()

    try:

        new_lead = Lead(

            business_name=business_name,

            business_type=business_type,

            owner_name=owner_name,

            whatsapp=whatsapp,

            email=email,

            user_id=current_user,
        )

        db.add(new_lead)

        db.commit()

        db.refresh(new_lead)

        file_name = None

        if sales_file and sales_file.filename:

            original_name = Path(
                sales_file.filename
            ).name

            extension = Path(
                original_name
            ).suffix.lower()

            allowed_extensions = {
                ".csv",
                ".xlsx",
                ".xls",
            }

            if extension not in allowed_extensions:

                db.delete(new_lead)

                db.commit()

                return {

                    "success": False,

                    "message":
                        "Only CSV, XLSX and XLS files are allowed.",
                }

            file_name = (
                f"lead_{new_lead.id}"
                f"{extension}"
            )

            saved_path = (
                UPLOAD_DIR /
                file_name
            )

            with saved_path.open("wb") as buffer:

                shutil.copyfileobj(
                    sales_file.file,
                    buffer,
                )

            new_lead.file_name = file_name

            db.commit()

        return {

            "success": True,

            "message":
                "Analysis request received successfully",

            "lead_id":
                new_lead.id,

            "file_name":
                file_name,
        }

    except Exception as error:

        db.rollback()

        print(
            "Database error:",
            error,
        )

        return {

            "success": False,

            "message":
                "Could not save the lead",

            "error":
                str(error),
        }

    finally:

        db.close()


# =========================================================
# GET MY LEADS
# =========================================================

@app.get("/api/leads")
def get_leads(
    user_id: int = Depends(get_current_user),
):

    db = SessionLocal()

    try:

        leads = (

            db.query(Lead)

            .filter(
                Lead.user_id == user_id
            )

            .order_by(
                Lead.created_at.desc()
            )

            .all()
        )

        return {

            "success": True,

            "total":
                len(leads),

            "leads": [

                {

                    "id":
                        lead.id,

                    "business_name":
                        lead.business_name,

                    "business_type":
                        lead.business_type,

                    "owner_name":
                        lead.owner_name,

                    "whatsapp":
                        lead.whatsapp,

                    "email":
                        lead.email,

                    "file_name":
                        lead.file_name,

                    "created_at": (

                        lead.created_at.isoformat()

                        if lead.created_at

                        else None
                    ),
                }

                for lead in leads
            ],
        }

    finally:

        db.close()


# =========================================================
# HELPERS
# =========================================================

def normalize_column_name(column):

    column = str(
        column
    ).strip().lower()

    column = re.sub(
        r"[^a-z0-9]+",
        "_",
        column,
    )

    column = re.sub(
        r"_+",
        "_",
        column,
    )

    return column.strip("_")


def find_column(df, aliases):

    columns = list(
        df.columns
    )

    for alias in aliases:

        alias = normalize_column_name(
            alias
        )

        if alias in columns:

            return alias

    for column in columns:

        for alias in aliases:

            alias = normalize_column_name(
                alias
            )

            if (
                alias in column
                or column in alias
            ):

                return column

    return None


def clean_numeric_series(series):

    cleaned = (

        series

        .astype(str)

        .str.replace(
            r"[₹$€£,\s]",
            "",
            regex=True,
        )

        .str.replace(
            "Rs.",
            "",
            regex=False,
        )

        .str.replace(
            "INR",
            "",
            regex=False,
        )
    )

    return pd.to_numeric(
        cleaned,
        errors="coerce",
    ).fillna(0)


def safe_text(value):

    if pd.isna(value):

        return ""

    return str(value).strip()


# =========================================================
# ANALYZE BUSINESS
# =========================================================

@app.get("/api/analyze/{lead_id}")
def analyze_business(

    lead_id: int,

    user_id: int = Depends(get_current_user),

):

    db = SessionLocal()

    try:

        # IMPORTANT:
        # User can analyze ONLY their own lead.

        lead = (

            db.query(Lead)

            .filter(
                Lead.id == lead_id,

                Lead.user_id == user_id,
            )

            .first()
        )

        if not lead:

            raise HTTPException(
                status_code=404,
                detail="Lead not found",
            )

        if not lead.file_name:

            return {

                "success": False,

                "message":
                    "No sales file uploaded for this lead",
            }

        file_path = (
            UPLOAD_DIR /
            lead.file_name
        )

        if not file_path.exists():

            return {

                "success": False,

                "message":
                    "Uploaded file not found",
            }

        extension = (
            file_path.suffix.lower()
        )

        if extension == ".csv":

            try:

                df = pd.read_csv(
                    file_path,
                    encoding="utf-8",
                )

            except UnicodeDecodeError:

                df = pd.read_csv(
                    file_path,
                    encoding="latin1",
                )

        elif extension in {
            ".xlsx",
            ".xls",
        }:

            df = pd.read_excel(
                file_path
            )

        else:

            return {

                "success": False,

                "message":
                    "Unsupported file format",
            }

        if df.empty:

            return {

                "success": False,

                "message":
                    "The uploaded file is empty",
            }

        df.columns = [
            normalize_column_name(
                col
            )
            for col in df.columns
        ]

        df = df.dropna(
            how="all"
        )

        if df.empty:

            return {

                "success": False,

                "message":
                    "The uploaded file contains no usable rows",
            }

        # =================================================
        # COLUMN DETECTION
        # =================================================

        revenue_col = find_column(
            df,
            [
                "sales",
                "revenue",
                "total_sales",
                "total_revenue",
                "amount",
                "total_amount",
                "sales_amount",
                "order_value",
                "net_sales",
                "net_revenue",
            ],
        )

        price_col = find_column(
            df,
            [
                "price",
                "unit_price",
                "selling_price",
                "sale_price",
                "product_price",
            ],
        )

        quantity_col = find_column(
            df,
            [
                "quantity",
                "qty",
                "units",
                "units_sold",
                "quantity_sold",
                "number_of_units",
            ],
        )

        product_col = find_column(
            df,
            [
                "product",
                "product_name",
                "product_title",
                "item",
                "item_name",
                "product_description",
            ],
        )

        category_col = find_column(
            df,
            [
                "category",
                "product_category",
                "category_name",
                "department",
            ],
        )

        customer_col = find_column(
            df,
            [
                "customer",
                "customer_name",
                "customer_id",
                "customerid",
                "client",
                "client_name",
                "client_id",
                "buyer",
                "buyer_name",
            ],
        )

        order_col = find_column(
            df,
            [
                "order_id",
                "orderid",
                "order",
                "transaction_id",
                "transactionid",
                "invoice_id",
                "invoice_number",
                "bill_id",
                "receipt_id",
            ],
        )

        date_col = find_column(
            df,
            [
                "order_date",
                "date",
                "sales_date",
                "transaction_date",
                "purchase_date",
                "invoice_date",
                "created_at",
            ],
        )

        brand_col = find_column(
            df,
            [
                "brand",
                "brand_name",
                "manufacturer",
            ],
        )

        rating_col = find_column(
            df,
            [
                "rating",
                "review_rating",
                "customer_rating",
                "stars",
            ],
        )

        # =================================================
        # CLEAN NUMBERS
        # =================================================

        for col in [
            revenue_col,
            price_col,
            quantity_col,
            rating_col,
        ]:

            if col:

                df[col] = clean_numeric_series(
                    df[col]
                )

        # =================================================
        # REVENUE
        # =================================================

        revenue_source = None

        if price_col and quantity_col:

            df["_calculated_revenue"] = (
                df[price_col]
                * df[quantity_col]
            )

            total_revenue = float(
                df["_calculated_revenue"].sum()
            )

            revenue_source = "price × quantity"

        elif revenue_col:

            total_revenue = float(
                df[revenue_col].sum()
            )

            revenue_source = revenue_col

        else:

            total_revenue = 0

        analysis_revenue_col = (

            "_calculated_revenue"

            if price_col and quantity_col

            else revenue_col
        )

        # =================================================
        # ORDERS
        # =================================================

        if order_col:

            total_orders = int(
                df[order_col]
                .dropna()
                .nunique()
            )

        else:

            total_orders = len(df)

        # =================================================
        # CUSTOMERS
        # =================================================

        total_customers = None

        if customer_col:

            valid_customers = (

                df[customer_col]
                .dropna()
                .astype(str)
                .str.strip()
            )

            valid_customers = valid_customers[
                valid_customers != ""
            ]

            total_customers = int(
                valid_customers.nunique()
            )

        # =================================================
        # QUANTITY
        # =================================================

        total_quantity = None

        if quantity_col:

            total_quantity = int(
                df[quantity_col].sum()
            )

        # =================================================
        # AOV
        # =================================================

        average_order_value = (

            total_revenue / total_orders

            if total_orders > 0

            else 0
        )

        # =================================================
        # CLASSIFICATION
        # =================================================

        if (
            revenue_col
            or (price_col and quantity_col)
            or (order_col and date_col)
        ):

            dataset_classification = (
                "Sales Dataset"
            )

        elif product_col and price_col:

            dataset_classification = (
                "Product / Catalog Dataset"
            )

        else:

            dataset_classification = (
                "General Business Dataset"
            )

        # =================================================
        # TOP PRODUCTS
        # =================================================

        top_products = []

        if (
            product_col
            and analysis_revenue_col
        ):

            data = (

                df.groupby(
                    product_col
                )[analysis_revenue_col]

                .sum()

                .sort_values(
                    ascending=False
                )

                .head(5)
            )

            for product, revenue in data.items():

                top_products.append({

                    "product":
                        safe_text(product),

                    "revenue":
                        round(
                            float(revenue),
                            2,
                        ),
                })

        # =================================================
        # BOTTOM PRODUCTS
        # =================================================

        bottom_products = []

        if (
            product_col
            and analysis_revenue_col
        ):

            data = (

                df.groupby(
                    product_col
                )[analysis_revenue_col]

                .sum()

                .sort_values(
                    ascending=True
                )

                .head(5)
            )

            for product, revenue in data.items():

                bottom_products.append({

                    "product":
                        safe_text(product),

                    "revenue":
                        round(
                            float(revenue),
                            2,
                        ),
                })

        # =================================================
        # PRODUCT INTELLIGENCE
        # =================================================

        product_intelligence = []

        if product_col:

            group_cols = [
                product_col
            ]

            if category_col:

                group_cols.append(
                    category_col
                )

            grouped = (

                df.groupby(
                    group_cols,
                    dropna=False,
                )
                .size()
                .reset_index(
                    name="rows"
                )
            )

            if analysis_revenue_col:

                revenue_data = (

                    df.groupby(
                        group_cols,
                        dropna=False,
                    )[analysis_revenue_col]

                    .sum()

                    .reset_index(
                        name="revenue"
                    )
                )

                grouped = grouped.merge(
                    revenue_data,
                    on=group_cols,
                    how="left",
                )

            else:

                grouped["revenue"] = 0

            if price_col:

                price_data = (

                    df.groupby(
                        group_cols,
                        dropna=False,
                    )[price_col]

                    .mean()

                    .reset_index(
                        name="average_price"
                    )
                )

                grouped = grouped.merge(
                    price_data,
                    on=group_cols,
                    how="left",
                )

            else:

                grouped["average_price"] = 0

            if quantity_col:

                quantity_data = (

                    df.groupby(
                        group_cols,
                        dropna=False,
                    )[quantity_col]

                    .sum()

                    .reset_index(
                        name="quantity"
                    )
                )

                grouped = grouped.merge(
                    quantity_data,
                    on=group_cols,
                    how="left",
                )

            else:

                grouped["quantity"] = 0

            grouped = (
                grouped
                .sort_values(
                    "revenue",
                    ascending=False,
                )
                .head(10)
            )

            for _, row in grouped.iterrows():

                item = {

                    "product":
                        safe_text(
                            row[product_col]
                        ),

                    "revenue":
                        round(
                            float(
                                row["revenue"]
                            ),
                            2,
                        ),

                    "average_price":
                        round(
                            float(
                                row["average_price"]
                            ),
                            2,
                        ),

                    "quantity":
                        int(
                            row["quantity"]
                        ),

                    "rows":
                        int(
                            row["rows"]
                        ),
                }

                if category_col:

                    item["category"] = safe_text(
                        row[category_col]
                    )

                product_intelligence.append(
                    item
                )

        # =================================================
        # TOP CATEGORIES
        # =================================================

        top_categories = []

        if (
            category_col
            and analysis_revenue_col
        ):

            data = (

                df.groupby(
                    category_col
                )[analysis_revenue_col]

                .sum()

                .sort_values(
                    ascending=False
                )

                .head(5)
            )

            for category, revenue in data.items():

                top_categories.append({

                    "category":
                        safe_text(category),

                    "revenue":
                        round(
                            float(revenue),
                            2,
                        ),
                })

        # =================================================
        # CATEGORY INTELLIGENCE
        # =================================================

        category_intelligence = []

        if category_col:

            grouped = (

                df.groupby(
                    category_col,
                    dropna=False,
                )
                .size()
                .reset_index(
                    name="rows"
                )
            )

            if analysis_revenue_col:

                revenue_data = (

                    df.groupby(
                        category_col
                    )[analysis_revenue_col]

                    .sum()

                    .reset_index(
                        name="revenue"
                    )
                )

                grouped = grouped.merge(
                    revenue_data,
                    on=category_col,
                    how="left",
                )

            else:

                grouped["revenue"] = 0

            if quantity_col:

                quantity_data = (

                    df.groupby(
                        category_col
                    )[quantity_col]

                    .sum()

                    .reset_index(
                        name="quantity"
                    )
                )

                grouped = grouped.merge(
                    quantity_data,
                    on=category_col,
                    how="left",
                )

            else:

                grouped["quantity"] = 0

            grouped = grouped.sort_values(
                "revenue",
                ascending=False,
            )

            for _, row in grouped.head(10).iterrows():

                category_intelligence.append({

                    "category":
                        safe_text(
                            row[category_col]
                        ),

                    "revenue":
                        round(
                            float(
                                row["revenue"]
                            ),
                            2,
                        ),

                    "quantity":
                        int(
                            row["quantity"]
                        ),

                    "rows":
                        int(
                            row["rows"]
                        ),
                })

        # =================================================
        # CUSTOMER INTELLIGENCE
        # =================================================

        customer_intelligence = {

            "available": False,

            "total_customers": 0,

            "repeat_customers": 0,

            "repeat_customer_rate": 0,

            "average_customer_revenue": 0,

            "top_customers": [],
        }

        if customer_col:

            customer_df = df.copy()

            customer_df[customer_col] = (
                customer_df[customer_col]
                .astype(str)
                .str.strip()
            )

            customer_df = customer_df[
                (
                    customer_df[customer_col]
                    != ""
                )
                &
                (
                    customer_df[customer_col]
                    .str.lower()
                    != "nan"
                )
            ].copy()

            if not customer_df.empty:

                if analysis_revenue_col:

                    customer_revenue = (

                        customer_df.groupby(
                            customer_col
                        )[analysis_revenue_col]

                        .sum()

                        .reset_index(
                            name="revenue"
                        )
                    )

                else:

                    customer_revenue = (

                        customer_df[
                            customer_col
                        ]
                        .value_counts()
                        .rename_axis(
                            customer_col
                        )
                        .reset_index(
                            name="revenue"
                        )
                    )

                if order_col:

                    customer_orders = (

                        customer_df.groupby(
                            customer_col
                        )[order_col]

                        .nunique()

                        .reset_index(
                            name="orders"
                        )
                    )

                else:

                    customer_orders = (

                        customer_df
                        .groupby(
                            customer_col
                        )
                        .size()
                        .reset_index(
                            name="orders"
                        )
                    )

                if quantity_col:

                    customer_quantity = (

                        customer_df.groupby(
                            customer_col
                        )[quantity_col]

                        .sum()

                        .reset_index(
                            name="quantity"
                        )
                    )

                else:

                    customer_quantity = (

                        customer_df
                        .groupby(
                            customer_col
                        )
                        .size()
                        .reset_index(
                            name="quantity"
                        )
                    )

                customer_summary = (

                    customer_revenue

                    .merge(
                        customer_orders,
                        on=customer_col,
                        how="left",
                    )

                    .merge(
                        customer_quantity,
                        on=customer_col,
                        how="left",
                    )
                )

                customer_count = len(
                    customer_summary
                )

                repeat_customers = int(
                    (
                        customer_summary["orders"]
                        > 1
                    ).sum()
                )

                repeat_customer_rate = (

                    repeat_customers
                    / customer_count
                    * 100

                    if customer_count > 0
                    else 0
                )

                average_customer_revenue = (

                    float(
                        customer_summary[
                            "revenue"
                        ].mean()
                    )

                    if customer_count > 0
                    else 0
                )

                if total_revenue > 0:

                    customer_summary[
                        "contribution_percent"
                    ] = (

                        customer_summary[
                            "revenue"
                        ]

                        / total_revenue

                        * 100
                    )

                else:

                    customer_summary[
                        "contribution_percent"
                    ] = 0

                customer_summary = (
                    customer_summary
                    .sort_values(
                        "revenue",
                        ascending=False,
                    )
                )

                top_customers = []

                for _, row in (
                    customer_summary.head(10)
                    .iterrows()
                ):

                    top_customers.append({

                        "customer":
                            safe_text(
                                row[customer_col]
                            ),

                        "revenue":
                            round(
                                float(
                                    row["revenue"]
                                ),
                                2,
                            ),

                        "orders":
                            int(
                                row["orders"]
                            ),

                        "quantity":
                            int(
                                row["quantity"]
                            ),

                        "contribution_percent":
                            round(
                                float(
                                    row[
                                        "contribution_percent"
                                    ]
                                ),
                                2,
                            ),
                    })

                customer_intelligence = {

                    "available": True,

                    "total_customers":
                        customer_count,

                    "repeat_customers":
                        repeat_customers,

                    "repeat_customer_rate":
                        round(
                            repeat_customer_rate,
                            2,
                        ),

                    "average_customer_revenue":
                        round(
                            average_customer_revenue,
                            2,
                        ),

                    "top_customers":
                        top_customers,
                }

        # =================================================
        # PRICING INTELLIGENCE
        # =================================================

        pricing_intelligence = {

            "available": False,

            "average_price": 0,

            "median_price": 0,

            "minimum_price": 0,

            "maximum_price": 0,

            "price_range": 0,

            "highest_priced_product": None,

            "lowest_priced_product": None,
        }

        if price_col:

            prices = df[price_col]

            prices = prices[
                prices > 0
            ]

            if not prices.empty:

                pricing_intelligence[
                    "available"
                ] = True

                pricing_intelligence[
                    "average_price"
                ] = round(
                    float(prices.mean()),
                    2,
                )

                pricing_intelligence[
                    "median_price"
                ] = round(
                    float(prices.median()),
                    2,
                )

                pricing_intelligence[
                    "minimum_price"
                ] = round(
                    float(prices.min()),
                    2,
                )

                pricing_intelligence[
                    "maximum_price"
                ] = round(
                    float(prices.max()),
                    2,
                )

                pricing_intelligence[
                    "price_range"
                ] = round(
                    float(
                        prices.max()
                        - prices.min()
                    ),
                    2,
                )

                if product_col:

                    max_index = df[
                        price_col
                    ].idxmax()

                    min_index = df[
                        price_col
                    ].idxmin()

                    pricing_intelligence[
                        "highest_priced_product"
                    ] = {

                        "product":
                            safe_text(
                                df.loc[
                                    max_index,
                                    product_col,
                                ]
                            ),

                        "price":
                            round(
                                float(
                                    df.loc[
                                        max_index,
                                        price_col,
                                    ]
                                ),
                                2,
                            ),
                    }

                    pricing_intelligence[
                        "lowest_priced_product"
                    ] = {

                        "product":
                            safe_text(
                                df.loc[
                                    min_index,
                                    product_col,
                                ]
                            ),

                        "price":
                            round(
                                float(
                                    df.loc[
                                        min_index,
                                        price_col,
                                    ]
                                ),
                                2,
                            ),
                    }

        # =================================================
        # BRAND INTELLIGENCE
        # =================================================

        brand_intelligence = []

        if brand_col:

            if analysis_revenue_col:

                data = (

                    df.groupby(
                        brand_col
                    )[analysis_revenue_col]

                    .sum()

                    .sort_values(
                        ascending=False
                    )

                    .head(10)
                )

                for brand, revenue in data.items():

                    brand_intelligence.append({

                        "brand":
                            safe_text(brand),

                        "revenue":
                            round(
                                float(revenue),
                                2,
                            ),
                    })

            else:

                data = (
                    df[brand_col]
                    .value_counts()
                    .head(10)
                )

                for brand, count in data.items():

                    brand_intelligence.append({

                        "brand":
                            safe_text(brand),

                        "revenue": 0,

                        "rows":
                            int(count),
                    })

        # =================================================
        # RATING INTELLIGENCE
        # =================================================

        rating_intelligence = {

            "available": False,

            "average_rating": 0,

            "highest_rating": 0,

            "lowest_rating": 0,
        }

        if rating_col:

            ratings = df[rating_col]

            ratings = ratings[
                ratings > 0
            ]

            if not ratings.empty:

                rating_intelligence[
                    "available"
                ] = True

                rating_intelligence[
                    "average_rating"
                ] = round(
                    float(ratings.mean()),
                    2,
                )

                rating_intelligence[
                    "highest_rating"
                ] = round(
                    float(ratings.max()),
                    2,
                )

                rating_intelligence[
                    "lowest_rating"
                ] = round(
                    float(ratings.min()),
                    2,
                )

        # =================================================
        # MONTHLY SALES
        # =================================================

        monthly_sales = []

        if (
            date_col
            and analysis_revenue_col
        ):

            df[date_col] = pd.to_datetime(
                df[date_col],
                errors="coerce",
            )

            valid = df[
                df[date_col].notna()
            ].copy()

            if not valid.empty:

                valid["month"] = (
                    valid[date_col]
                    .dt.to_period("M")
                    .astype(str)
                )

                monthly = (

                    valid
                    .groupby("month")
                    [analysis_revenue_col]
                    .sum()
                    .sort_index()
                )

                for month, revenue in monthly.items():

                    monthly_sales.append({

                        "month":
                            str(month),

                        "revenue":
                            round(
                                float(revenue),
                                2,
                            ),
                    })

        # =================================================
        # GROWTH
        # =================================================

        growth_percent = None
        best_month = None
        worst_month = None

        if monthly_sales:

            values = [
                x["revenue"]
                for x in monthly_sales
            ]

            best_month = monthly_sales[
                values.index(
                    max(values)
                )
            ]

            worst_month = monthly_sales[
                values.index(
                    min(values)
                )
            ]

            if len(values) >= 2:

                previous = values[-2]
                latest = values[-1]

                if previous != 0:

                    growth_percent = (
                        (
                            latest
                            - previous
                        )
                        / previous
                    ) * 100

        # =================================================
        # DETECTED COLUMNS
        # =================================================

        detected_columns = {

            "revenue":
                revenue_col,

            "price":
                price_col,

            "quantity":
                quantity_col,

            "product":
                product_col,

            "category":
                category_col,

            "customer":
                customer_col,

            "order":
                order_col,

            "date":
                date_col,

            "brand":
                brand_col,

            "rating":
                rating_col,
        }

        detected_fields = sum(
            value is not None
            for value
            in detected_columns.values()
        )

        missing_fields = [

            key

            for key, value
            in detected_columns.items()

            if value is None
        ]

        data_quality = {

            "rows":
                len(df),

            "columns":
                len(df.columns),

            "detected_fields":
                detected_fields,

            "missing_fields":
                missing_fields,
        }

        # =================================================
        # INSIGHTS
        # =================================================

        insights = []

        if total_revenue > 0:

            insights.append(
                f"Total revenue generated is "
                f"₹{total_revenue:,.2f}."
            )

        if dataset_classification == (
            "Product / Catalog Dataset"
        ):

            insights.append(
                f"The dataset contains "
                f"{len(df):,} product records."
            )

        elif total_orders > 0:

            insights.append(
                f"The dataset contains "
                f"{total_orders:,} orders."
            )

        if total_customers is not None:

            insights.append(
                f"The business has "
                f"{total_customers:,} unique customers."
            )

        else:

            insights.append(
                "Customer information is not "
                "available in the uploaded dataset."
            )

        if total_quantity is not None:

            insights.append(
                f"Total quantity sold is "
                f"{total_quantity:,} units."
            )

        else:

            insights.append(
                "Quantity information is not "
                "available in the uploaded dataset."
            )

        if average_order_value > 0:

            insights.append(
                f"Average order value is "
                f"₹{average_order_value:,.2f}."
            )

        if customer_intelligence["available"]:

            if customer_intelligence[
                "repeat_customers"
            ] > 0:

                insights.append(
                    f"{customer_intelligence['repeat_customers']:,} "
                    f"customers are repeat buyers."
                )

            if customer_intelligence[
                "top_customers"
            ]:

                top_customer = (
                    customer_intelligence[
                        "top_customers"
                    ][0]
                )

                insights.append(
                    f"{top_customer['customer']} is the "
                    f"top customer, contributing "
                    f"₹{top_customer['revenue']:,.2f}."
                )

        if top_products:

            insights.append(
                f"{top_products[0]['product']} is the "
                f"top-performing product, generating "
                f"₹{top_products[0]['revenue']:,.2f}."
            )

        if top_categories:

            insights.append(
                f"{top_categories[0]['category']} is the "
                f"highest-revenue category."
            )

        if pricing_intelligence["available"]:

            insights.append(
                f"Average product price is "
                f"₹{pricing_intelligence['average_price']:,.2f}."
            )

        if rating_intelligence["available"]:

            insights.append(
                f"Average product rating is "
                f"{rating_intelligence['average_rating']:.2f}."
            )

        if growth_percent is not None:

            if growth_percent > 0:

                insights.append(
                    f"Revenue increased by "
                    f"{growth_percent:.1f}% "
                    f"compared with the previous month."
                )

            elif growth_percent < 0:

                insights.append(
                    f"Revenue decreased by "
                    f"{abs(growth_percent):.1f}% "
                    f"compared with the previous month."
                )

            else:

                insights.append(
                    "Revenue remained stable "
                    "compared with the previous month."
                )

        if best_month:

            insights.append(
                f"{best_month['month']} was the best "
                f"month with revenue of "
                f"₹{best_month['revenue']:,.2f}."
            )

        # =================================================
        # RECOMMENDATIONS
        # =================================================

        recommendations = []

        if top_products:

            recommendations.append(
                f"Consider maintaining higher inventory "
                f"for {top_products[0]['product']} because "
                f"it is a strong revenue-generating product."
            )

        if bottom_products:

            recommendations.append(
                f"Review {bottom_products[0]['product']} "
                f"for pricing, promotion or inventory changes."
            )

        if pricing_intelligence["available"]:

            recommendations.append(
                "Use product-level price and revenue data "
                "to optimize pricing and product mix."
            )

        if growth_percent is not None:

            if growth_percent > 10:

                recommendations.append(
                    "Revenue is showing strong growth. "
                    "Consider increasing stock and marketing."
                )

            elif growth_percent < -10:

                recommendations.append(
                    "Revenue has declined significantly. "
                    "Review pricing, product mix and demand."
                )

        if top_categories:

            recommendations.append(
                f"Prioritize marketing around "
                f"{top_categories[0]['category']}."
            )

        if customer_intelligence["available"]:

            if customer_intelligence[
                "repeat_customers"
            ] > 0:

                recommendations.append(
                    "Focus on repeat customers with "
                    "loyalty offers, personalized promotions "
                    "and retention campaigns."
                )

            else:

                recommendations.append(
                    "Focus on customer retention strategies "
                    "to increase repeat purchases."
                )

        if not recommendations:

            recommendations.append(
                "Upload a richer sales dataset with "
                "product, customer, quantity and date "
                "information for deeper recommendations."
            )

        # =================================================
        # FINAL RESPONSE
        # =================================================

        return {

            "success": True,

            "lead": {

                "id":
                    lead.id,

                "business_name":
                    lead.business_name,

                "business_type":
                    lead.business_type,
            },

            "file":
                lead.file_name,

            "dataset_classification":
                dataset_classification,

            "rows":
                len(df),

            "columns":
                list(df.columns),

            "detected_columns":
                detected_columns,

            "data_quality":
                data_quality,

            "metrics": {

                "total_revenue":
                    round(
                        total_revenue,
                        2,
                    ),

                "total_orders":
                    total_orders,

                "total_customers":
                    total_customers,

                "total_quantity":
                    total_quantity,

                "average_order_value":
                    round(
                        average_order_value,
                        2,
                    ),

                "revenue_source":
                    revenue_source,
            },

            "growth": {

                "percentage":

                    (
                        round(
                            growth_percent,
                            2,
                        )

                        if growth_percent is not None

                        else None
                    ),

                "best_month":
                    best_month,

                "worst_month":
                    worst_month,
            },

            "top_products":
                top_products,

            "bottom_products":
                bottom_products,

            "product_intelligence":
                product_intelligence,

            "top_categories":
                top_categories,

            "category_intelligence":
                category_intelligence,

            "customer_intelligence":
                customer_intelligence,

            "pricing_intelligence":
                pricing_intelligence,

            "brand_intelligence":
                brand_intelligence,

            "rating_intelligence":
                rating_intelligence,

            "monthly_sales":
                monthly_sales,

            "insights":
                insights,

            "recommendations":
                recommendations,
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "Analysis error:",
            error,
        )

        return {

            "success": False,

            "message":
                str(error),
        }

    finally:

        db.close()