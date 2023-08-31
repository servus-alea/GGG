// Fungsi untuk mencari rata-rata
function average(arr: number[]): number {
    return arr.reduce((acc, val) => acc + val, 0) / arr.length;
}

// Fungsi untuk mencari modus
function mode(arr: number[]): number | null {
    let frequency: { [key: number]: number; } = {};
    let maxFrequency = -Infinity;
    let modeVal: number | null = null;

    for (let num of arr) {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFrequency) {
            maxFrequency = frequency[num];
            modeVal = num;
        }
    }

    // Jika setiap angka hanya muncul sekali, maka tidak ada modus
    if (maxFrequency === 1) return null;

    return modeVal;
}

export {
    average, mode
};