function generateCode() {
    const chars = "0123456789ABCDEF";
    let code = ""

    for (let i=0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * 16)];
    }

    return code
}

module.exports = generateCode