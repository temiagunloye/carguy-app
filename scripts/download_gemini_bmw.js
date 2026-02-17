const https = require('https');
const fs = require('fs');
const path = require('path');

const DOWNLOADS = [
    {
        url: 'https://lh3.googleusercontent.com/gg-dl/AOI_d_-CAOEnd4o1nH8llzC7GOEsMnLMu6gIaLd2tM4GiSDtBNqjOsKyKFd5aKnpu1kP-Gu_67wMI8II8Lpm7ql6NMc9HcoK8Don1FrtxGaDhgQ3opGf0PYKq0shlrbJuL_n4HFO0tFelE7jrvrtA7HypckLrrRPm_NOqlfkh9NQzKt-bkgL=s1024-rj',
        dest: 'tmp/final-renders/bmw_m3_2024/driver_rear.png'
    },
    {
        url: 'https://lh3.googleusercontent.com/gg-dl/AOI_d_867B0Zj3TxnIhf1OdnWkR2oXa2dfmJtn9kXnyidcW0t6oO943QIKHtWM0URwOGa0alUQg_4Wqr9r1grYkh7SWGhHBtxQrOcqVkLkl61k8n9OkKHWVksc3_a9jDUcoDuvHazECcoj08ECRgSluGCKCnNjAU7oW3vmoPs4M6_cVq9lHaNQ=s1024-rj',
        dest: 'tmp/final-renders/bmw_m3_2024/rear_center.png'
    },
    {
        url: 'https://lh3.googleusercontent.com/gg-dl/AOI_d_8hwDbBjDuRgRvhOfIlMRLsZPdr7FDZ7QHQ4ik0aOdz0xVcVZ19exuRtxxcqSpXXzQdT7DjNL3uxbkS1s8zOISjp0VdRFtKCOMnxvnu46GQTv9rN2QEy34Ofo0A31VUkwM1PCpidc6h41g5xLPijiIjrfrRmkXJQTBv2RiNJe6NB6r0DA=s1024-rj',
        dest: 'tmp/final-renders/bmw_m3_2024/front_low.png'
    },
    {
        url: 'https://lh3.googleusercontent.com/gg-dl/AOI_d_9lNs7NgaTu-hc80dBdt-Hn85nv2B7yDUM68tCo_vKEehtHLqtdC3nTDFws5NgmY2QlzsQxDkDwdpotdM7CvMokqznhxeKQqh8kgkjyPVVMytQCYqUPLqmvkuIBitJwVeYvGWDy8UQZIbOtdpqXYSB-Q0DfAqzk4VBlAT3RFIc8f_rrsA=s1024-rj',
        dest: 'tmp/final-renders/bmw_m3_2024/rear_low.png'
    }
];

async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                return downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(outputPath);
            });
            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    console.log('⬇️  Downloading Gemini-generated BMW M3 renders...\n');

    for (const { url, dest } of DOWNLOADS) {
        const fullPath = path.join(__dirname, '..', dest);
        try {
            console.log(`   📥 ${path.basename(dest)}...`);
            await downloadImage(url, fullPath);
            console.log(`      ✅ Saved (${fs.statSync(fullPath).size} bytes)`);
        } catch (error) {
            console.error(`      ❌ Failed: ${error.message}`);
        }
    }

    console.log('\n✅ BMW M3 downloads complete!');
}

main().catch(console.error);
