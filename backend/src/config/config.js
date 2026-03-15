function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Falta la variable de entorno requerida ${name}`);
    return value
}


const config = {
    
    port: Number(process.env.PORT || 3000),

    db: {
        host: requireEnv("DB_HOST"),
        port: requireEnv("DB_PORT"),
        user: requireEnv("DB_USER"),
        password: requireEnv("DB_PASSWORD"),
        name: requireEnv("DB_NAME")
    }
};


export default config;