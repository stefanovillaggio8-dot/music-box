const CACHE = "spotifynonavraiimieisoldi-v6336";
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./lyrics.json",
  /* File minuscolo col numero di versione e di brani: serve al controllo
     veloce (il telefono lo legge ogni 20 secondi invece di scaricare 400 KB). */
  "./versione.json",
  "./covers.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];
const SONGS = [
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-2.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-4.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-5.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-6.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-7.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-8.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-9.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-10.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-11.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-12.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-13.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-14.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-15.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-16.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-17.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-18.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-19.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-20.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-23.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-24.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-25.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-26.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-27.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-28.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-29.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-30.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-31.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-32.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-33.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-34.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-35.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-36.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-37.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-38.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-39.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-40.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-41.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-42.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-43.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-44.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-45.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-46.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-47.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-48.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-49.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-50.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-51.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-52.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-53.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-54.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-55.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-56.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-57.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-58.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-59.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-60.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-61.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-63.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-64.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-65.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-66.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-67.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-73.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-74.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-75.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-77.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-78.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-79.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-80.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-81.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-87.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-88.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-89.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-90.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-91.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-92.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-93.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-94.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-95.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-96.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-97.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-98.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-99.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-100.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-101.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-102.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-103.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-105.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-106.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-107.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-108.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-109.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-110.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-111.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-112.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-113.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-114.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-115.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-116.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-117.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-118.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-119.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-120.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-121.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-122.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-123.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-124.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-125.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-126.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-127.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-128.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-129.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-130.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-131.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-133.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-134.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-135.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-136.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-138.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-68.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-69.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-71.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-72.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-76.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-139.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-140.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-141.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-143.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-144.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-146.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-147.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-148.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-149.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-150.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-152.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-153.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-154.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-155.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-157.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-158.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-159.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-160.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-161.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-162.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-163.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-164.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-165.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-166.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-168.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-169.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-170.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-171.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-173.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-174.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-175.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-176.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-178.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-179.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-180.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-181.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-182.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-183.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-184.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-185.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-187.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-188.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-189.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-190.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-191.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-192.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-193.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-194.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-195.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-196.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-198.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-200.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-201.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-203.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-205.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-206.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-207.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-208.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-209.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-210.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-211.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-212.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-213.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-215.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-216.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-217.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-218.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-219.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-220.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-221.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-222.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-224.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-225.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-226.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-227.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-228.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-229.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-230.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-231.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-232.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-233.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-234.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-236.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-237.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-239.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-240.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-241.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-242.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-243.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-244.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-246.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-247.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-248.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-245.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-249.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-250.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-251.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-252.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-253.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-254.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-255.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-256.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-257.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-258.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-259.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-260.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-261.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-263.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-264.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-265.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-262.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-266.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-280.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-268.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-269.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-270.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-281.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-272.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-273.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-274.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-275.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-276.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-294.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-278.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-279.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-283.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-284.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-285.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-286.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-287.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-288.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-295.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-290.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-291.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-292.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-293.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-296.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-297.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-298.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-308.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-300.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-301.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-302.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-303.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-304.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-305.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-306.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-307.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-309.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-310.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-311.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-312.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-313.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-314.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-315.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-316.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-317.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-318.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-319.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-320.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-321.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-322.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-323.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-324.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-325.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-326.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-327.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-328.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-329.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-330.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-331.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-332.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-333.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-334.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-335.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-336.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-337.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-338.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-339.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-340.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-341.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-342.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-349.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-344.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-345.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-346.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-347.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-348.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-350.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-351.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-352.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-353.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-363.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-355.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-356.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-357.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-358.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-359.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-360.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-361.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-362.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-377.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-365.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-378.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-367.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-368.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-369.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-370.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-379.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-390.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-372.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-373.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-374.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-375.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-376.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-380.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-381.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-382.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-383.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-384.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-391.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-386.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-387.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-388.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-389.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-392.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-393.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-394.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-395.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-396.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-397.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-398.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-399.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-400.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-401.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-402.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-403.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-404.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-405.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-406.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-423.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-415.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-426.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-438.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-428.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-430.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-432.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-433.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-434.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-435.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-436.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-437.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-424.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-440.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-425.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-443.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-444.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-446.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-448.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-449.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-450.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-451.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-452.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-453.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-454.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-455.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-456.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-457.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-458.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-459.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-460.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-461.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-462.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-463.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-464.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-466.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-467.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-468.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-469.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-470.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-472.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-473.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-474.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-475.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-477.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-480.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-478.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-479.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-482.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-483.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-484.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-485.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-486.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-487.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-488.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-489.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-490.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-491.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-492.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-493.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-494.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-495.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-496.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-497.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-498.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-499.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-500.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-501.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-502.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-503.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-504.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-505.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-506.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-507.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-508.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-509.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-510.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-511.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-512.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-513.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-514.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-515.mp3",
];

/* PRIMA, a ogni aggiornamento, scaricavo TUTTE le canzoni (161 MB) sul
   telefono. Il telefono restavaoccupato a scaricare musica e la libreria non
   si aggiornava piu'. Ora all'aggiornamento scarico solo i file piccoli del
   sito: le canzoni restano li' e si scaricano solo quando le ascolti o
   quando premi tu "scarica per offline". */
async function cacheSongs(cache) {
  return 0;
}

/* Ste: "se tocco la versione non fa niente, non si aggiorna".
   Prima non si aggiornava perche' avevo tolto il "skipWaiting": il worker
   nuovo aspettava che l'app venisse chiusa del tutto, quindi ricaricando la
   pagina si continuava a usare la versione vecchia, e con lei i nomi dei
   brani tornavano come prima.

   Adesso e' cosi': il worker aspetta (non ti interrompe mentre usi l'app),
   ma quando TOCCI il numero della versione gli dico "attivati adesso" e la
   pagina si ricarica con tutto nuovo. */
self.addEventListener("message", (event) => {
  const tipo = (event && event.data && event.data.type) || "";
  if (tipo === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const results = await Promise.allSettled(CORE.map((url) => cache.add(url)));
      const failed = results
        .map((r, i) => (r.status === "rejected" ? CORE[i] : null))
        .filter(Boolean);
      if (failed.length) console.warn("Non memorizzate:", failed.join(", "));
      cacheSongs(cache);
      /* Ste: "l'app si aggiorna continuamente e ogni volta toglie le
         canzoni". Prima facevo "skipWaiting": la nuova versione si
         impadroniva subito della pagina aperta, anche mentre stavi usando
         l'app (e la ricaricava). Adesso l'aggiornamento aspetta: entra
         quando riapri l'app, senza mezze sorprese. */
    })
  );
});

function isMusicBoxSong(url) {
  return url.hostname === "raw.githubusercontent.com" &&
    url.pathname.startsWith("/stefanovillaggio8-dot/music-box-brani/main/songs/") &&
    /\.mp3$/i.test(url.pathname);
}

async function migrateOfflineSongsAndCleanup() {
  const keys = await caches.keys();
  const oldKeys = keys.filter((key) => key !== CACHE);
  const activeCache = await caches.open(CACHE);

  /* Prima di eliminare vecchie cache, controllo che la versione nuova contenga
     tutti i file essenziali. Se l'installazione e' incompleta, non elimino nulla. */
  const coreReady = await Promise.all(CORE.map(async (file) => {
    try {
      return !!(await activeCache.match(new URL(file, self.registration.scope).href));
    } catch (_) {
      return false;
    }
  }));
  if (!coreReady.every(Boolean)) {
    console.warn("Cache nuova incompleta: conservo le cache precedenti.");
    return;
  }

  const removable = [];
  for (const key of oldKeys) {
    const oldCache = await caches.open(key);
    let safeToDelete = true;
    const requests = await oldCache.keys();

    for (const request of requests) {
      let url;
      try { url = new URL(request.url); } catch (_) { continue; }
      /* Ste: "diego aveva scaricato le canzoni, ha chiuso l'app e una
         volta riaperta doveva di nuovo scaricarle".

         Motivo: qui migravo solo i brani con l'indirizzo di
         raw.githubusercontent. Ma dal computer e da tailscale i brani hanno
         un indirizzo LOCALE (http://100.x:8788/app/songs/...), e quelli
         non venivano migrati: all'aggiornamento la cache vecchia veniva
         cancellata e le canzoni scaricate andavano perse.

         Adesso migro QUALSIASI file audio, da qualunque indirizzo. */
      const eBrano = /\.mp3$/i.test(url.pathname) || isMusicBoxSong(url);
      if (!eBrano) continue;

      const cacheKey = new Request(url.href);
      if (await activeCache.match(cacheKey)) continue;

      const response = await oldCache.match(request);
      if (!response) continue;
      try {
        await activeCache.put(cacheKey, response.clone());
        if (!(await activeCache.match(cacheKey))) safeToDelete = false;
      } catch (error) {
        console.warn("Non riesco a migrare una canzone offline; conservo la vecchia cache.", error);
        safeToDelete = false;
      }
    }

    if (safeToDelete) removable.push(key);
  }

  await Promise.all(removable.map((key) => caches.delete(key)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    migrateOfflineSongsAndCleanup().catch((error) => {
      /* In caso di problema, meglio conservare i dati delle versioni precedenti. */
      console.warn("Migrazione cache non completata; conservo le cache precedenti.", error);
    }).then(() => self.clients.claim())
  );
});

const CORE_EXT = [".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".webp"];

async function findCachedMusic(url) {
  const keys = (await caches.keys()).slice().reverse();
  for (const key of keys) {
    try {
      const cache = await caches.open(key);
      const response = await cache.match(new Request(url));
      if (response) return response;
    } catch (_) { /* provo la cache successiva */ }
  }
  return null;
}

/* Se il brano e' gia' salvato, lo uso subito: e' quello che rende
     istantaneo lo spostamento dentro la canzone. */
async function rispostaDallaCache(cached, range) {
  if (!range) return cached;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return cached;
  const blob = await cached.blob();
  const size = blob.size;
  let start;
  let end;
  if (!match[1]) {
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || end < start) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": "bytes */" + size }
    });
  }
  const part = blob.slice(start, end + 1, blob.type || "audio/mpeg");
  return new Response(part, {
    status: 206,
    headers: {
      "Content-Type": blob.type || "audio/mpeg",
      "Content-Length": String(part.size),
      "Content-Range": "bytes " + start + "-" + end + "/" + size,
      "Accept-Ranges": "bytes"
    }
  });
}

async function cachedMusicResponse(event) {
  const range = event.request.headers.get("range");
  const gia = await findCachedMusic(event.request.url);
  /* Brano gia' in mano: lo uso subito, senza aspettare la rete. */
  if (gia) {
    try {
      return await rispostaDallaCache(gia, range);
    } catch (e) { /* se non riesco, vado in rete */ }
  }
  try {
    const response = await fetch(event.request);
    /* Salvo solo risposte complete (200), mai un pezzo audio (206). */
    if (response && response.status === 200 && !range && response.type !== "opaque") {
      event.waitUntil(
        caches.open(CACHE).then((cache) => cache.put(new Request(event.request.url), response.clone()))
          .catch(() => {})
      );
    }
    return response;
  } catch (error) {
    if (!gia) {
      return new Response("Brano non disponibile offline", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return await rispostaDallaCache(gia, range);
  }
}


self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  /* Le canzoni sono ospitate su raw.githubusercontent.com, fuori dall'origine
     della pagina: prima venivano escluse e quindi le copie offline non suonavano. */
  if (isMusicBoxSong(url)) {
    event.respondWith(cachedMusicResponse(event));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {})
            );
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  const isCore = CORE_EXT.some((ext) => url.pathname.endsWith(ext));

  if (isCore) {
    event.respondWith(
      fetch(new Request(event.request.url, { cache: "reload", credentials: "same-origin" }))
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {})
            );
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {})
            );
          }
          return response;
        });
      })
    );
  }
});
