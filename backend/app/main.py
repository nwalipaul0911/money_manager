import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.realtime import set_event_loop
from app.routers import auth, network, profiles, review, transactions, wishlist, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    set_event_loop(asyncio.get_running_loop())
    yield


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Money Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(network.router)
app.include_router(profiles.router)
app.include_router(transactions.router)
app.include_router(wishlist.router)
app.include_router(review.router)
app.include_router(ws.router)


@app.get("/health")
def health():
    return {"status": "ok"}
