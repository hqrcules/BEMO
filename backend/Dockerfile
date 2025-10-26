FROM python:3.11-slim

WORKDIR /app/backend

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gettext \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ /app/backend/requirements/
RUN pip install --upgrade pip
RUN pip install -r requirements/development.txt

COPY . /app/backend/

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]